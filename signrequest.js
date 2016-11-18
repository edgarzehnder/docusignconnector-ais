'use strict';

var https = require('https');	
var Promise = require('promise');
var pending_string = "urn:oasis:names:tc:dss:1.0:profiles:asynchronousprocessing:resultmajor:Pending";
var success_string = "urn:oasis:names:tc:dss:1.0:resultmajor:Success";
var error_string = "urn:oasis:names:tc:dss:1.0:resultmajor:RequesterError";
var sleep = require('sleep-async')();
var util = require('util');
var dateFormat = require('date-format');

function signpwdotp(info) {

	return new Promise(function(resolve, reject) {

		if (info == undefined) {
			reject("Sign Info unavailable - cannot sign.");
		} 

		var result = sign(info);

		result.then(function(result) {

			console.log(util.inspect(result));

			if (result.SignResponse.Result.ResultMajor == error_string) {
				console.log(result.SignResponse.Result.ResultMinor);
				reject(result.SignResponse.Result.ResultMinor);
			}
			
			var response_id = result.SignResponse.OptionalOutputs['async.ResponseID'];

			// Check if PwdOTP or MobileID (ConsentURL available or not)	
			var optional_outputs = result.SignResponse.OptionalOutputs;
			var consent_url;	
			

			if (optional_outputs.hasOwnProperty('sc.StepUpAuthorisationInfo')) {
				
				console.log("Using PwdOTP for Declaration of Will.");
				consent_url = result.SignResponse.OptionalOutputs['sc.StepUpAuthorisationInfo']['sc.Result']['sc.ConsentURL'];
			} else {
				consent_url = "NONE";
			}
	
			var pending_response = {	
				'url': consent_url,
				'id': response_id 
			};

			// Return consent url	
			resolve(pending_response);
		
		}, function(error) {
			reject(error);
		});
	});
}

function sign(info) {

	return new Promise(function(resolve, reject) {


		var body = JSON.parse(info);
		// console.log("Body: " + util.inspect(body));

		var hash = body.documents[0].data;
		// console.log("- Hash: " + hash);
		var name = body.documents[0].name;
		// console.log("- Name: " + name);

		// Credentials type "sms" SHOULD BE included in the user object
                var phone;
                if (body.user.hasOwnProperty('credentials') && body.user.credentials.length > 0) {
                        phone = body.user.credentials[0].value;

                        // Number is a string in the form "+41 79 123 45 67"
                        // Remove blanks
                        phone = phone.replace(/\s/g, '');
                        // Remove the '+'
                        phone = phone.replace(/\+/g, '');

                } else {
                        // phone is undefined
                        if (process.env.NODE_ENV == "development") {
                                // Development hack: docusign is not sending the phone, I can set it as an ENV
                                phone = process.env.PHONE;
                                console.log("Development: phone not delivered in response and therefore set to: " + phone);
                        }
                }

		// Build the DN, with the user name in the DS response and the configured values
		var prefix = process.env.CN_PREFIX? process.env.CN_PREFIX + ' ' : '';	
		var dn = 'cn=' + prefix + body.user.displayName + ', ' + process.env.DN_SUFFIX;
	
		var json = getJsonRequest(process.env.CLAIMED_IDENTITY, dn, phone, name, hash);
		var data_length = Buffer.byteLength(JSON.stringify(json));	
		var sign_options = getOptions(data_length, false);

        	var sign_req = https.request(sign_options, function(sign_res){
       			sign_res.setEncoding('utf8');
                	var body = '';
                	sign_res.on('data', function(chunk) {
                        	body += chunk;
                	});

                	sign_res.on('end', function() {
				resolve(JSON.parse(body));
			});        	

		});

		// set socket timeout to 300000 miliseconds
		sign_req.on('socket', function(socket) {
			socket.setTimeout(300000);
			socket.on('timeout', function() {
				req.abort();
			});
		});
		sign_req.write(JSON.stringify(json));
		sign_req.end();
	});
}

function pending(responseID, counter) {

	return new Promise(function(resolve, reject) {

		var json = getPendingJsonRequest(process.env.CLAIMED_IDENTITY, responseID);
		var data_length = Buffer.byteLength(JSON.stringify(json));
		var pending_options = getOptions(data_length, true);
		
		// Try 3 times in 10 seconds interval	
		var max_count = 10;
		sleep.sleep(10000, function() {

			counter++;
			var pending_req = https.request(pending_options, function(pending_res) {
				var body = '';
				pending_res.on('data', function(chunk) {
					body += chunk;
				});

				pending_res.on('end', function() {
					var sign_response_json = JSON.parse(body);
					var sign_response = sign_response_json.SignResponse;
					var pending_result = sign_response.Result.ResultMajor;

					// TODO Check if error
					if (pending_result != pending_string) {
						if (pending_result != success_string) {
							// No success and no pending: error
							console.log(util.inspect(sign_response_json));	
							reject("Error: " + sign_response.Result.ResultMinor);
						} else {
							// Success
							console.log("Success!");
							resolve(sign_response.SignatureObject.Base64Signature.$);
						}
					
					} else {
						// Pending
						if (counter == max_count) {
							console.log("Timeout!");
							reject("Timeout!");	
						} else {
							console.log("Pending... counter=" + counter);
							resolve(pending(responseID, counter));
						}
					}
				});
			});

			// set socket timeout to 300000 miliseconds
			pending_req.on('socket', function(socket) {
				socket.setTimeout(300000);
				socket.on('timeout', function() {
					req.abort();
				});
			});
			pending_req.write(JSON.stringify(json));
			pending_req.end();
		});
	});
}

function getOptions(length, poll) {

	var fs = require('fs');
	var url = require('url');

	// AIs URL defaults to production but it can be overriden by an ENV variable
	var ais = process.env.AIS?process.env.AIS:'https://ais.swisscom.ch/AIS-Server/rs/v1.0';
	var ais_url = poll ? url.parse(ais + '/pending') : url.parse(ais + '/sign');

	var sign_options = {
		host: ais_url.hostname,
		port: 443,
		path: ais_url.path,
		method: 'POST',
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Content-Length": length,
			"Accept": "application/json"
		},
		key: process.env.KEY,
		cert: process.env.CERT,
		ca: process.env.CA
	};
	return sign_options;
}

function getJsonRequest(claimedIdentity, dn, phone, name, hash) {

	var now = new Date();
	var dtbd = process.env.DTBD | 'Do you want to sign';
	var language = process.env.LANGUAGE | 'en';

	return {
	  "SignRequest": {
	    "@RequestID": dateFormat(now, "yyyy-MM-dd'T'HH:mm:ss.SSSZ"),
	    "@Profile": "http://ais.swisscom.ch/1.1",
	    "OptionalInputs": {
	      "ClaimedIdentity": {
		"Name": claimedIdentity 
	      },
	      "SignatureType": "urn:ietf:rfc:3369",
	      "AdditionalProfile": [
			"http://ais.swisscom.ch/1.0/profiles/ondemandcertificate", 
			"urn:oasis:names:tc:dss:1.0:profiles:asynchronousprocessing",
     			"http://ais.swisscom.ch/1.1/profiles/redirect"
		],
	      "sc.CertificateRequest": {
                                "sc.DistinguishedName": dn,
                                "sc.StepUpAuthorisation": {
                                        "sc.Phone": {
                                                "sc.MSISDN": phone,
                                                "sc.Message": dtbd + " " +  name + "?",
                                                "sc.Language": language 
                                        }
                                }
                        },
	      "AddTimestamp": {"@Type": "urn:ietf:rfc:3161"},
	      "sc.AddRevocationInformation": {"@Type": "BOTH"}
	    },
	    "InputDocuments": {
	      "DocumentHash": {
		"dsig.DigestMethod": {
		  "@Algorithm": "http://www.w3.org/2001/04/xmlenc#sha256"
		},
		"dsig.DigestValue": hash 
	      }
	    }
	  }
	}
}

function getPendingJsonRequest(claimedIdentity, responseID) {
	return {
	  "async.PendingRequest": {
	    "@Profile": "http://ais.swisscom.ch/1.1",
	    "OptionalInputs": {
	      "ClaimedIdentity": {
		"Name": claimedIdentity
	      },
	      "async.ResponseID": responseID
	    }
	  }
	}
}

module.exports= {
	signpwdotp: signpwdotp,
	sign: sign,
	pending: pending
}
