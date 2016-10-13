'use strict';

var https = require('https');	
var config = require('./config');
var Promise = require('promise');
var pending_string = "urn:oasis:names:tc:dss:1.0:profiles:asynchronousprocessing:resultmajor:Pending";
var sleep = require('sleep-async')();
var util = require('util');
var dateFormat = require('date-format');

// Until DocuSign client is working
var info_tmp = {
	documents: [ 
		{	
		name: 'Test',
		data: '1WON4H3Hrinf7LYRNmhV6Uf7apdUvuYEsmhxAklxumA=',
		}
	],
	user: {
		displayName: 'Eva',
		email: 'eva@me.com',
		// phoneNumber: '41792533729'	
		phoneNumber: '41794374625'
	}
}

function signpwdotp(info) {

	return new Promise(function(resolve, reject) {

		if (info == undefined) {
			reject("Sign Info unavailable - cannot sign.");
		} else {
			console.log("Sign");
		}

	//	console.log("Info: " + util.inspect(info));	
		var result = sign(info);

		result.then(function(result) {

			console.log("------------------------------------------");
			console.log(util.inspect(result));
			console.log("------------------------------------------");

			var response_id = result.SignResponse.OptionalOutputs['async.ResponseID'];

			// Check if PwdOTP or MobileID (ConsentURL available or not)	
			var optional_outputs = result.SignResponse.OptionalOutputs;
			var consent_url;	
			if (optional_outputs.hasOwnProperty('sc.StepUpAuthorisationInfo')) {
				
				console.log("Using PwdOTP for Declaration of Will.");
				consent_url = result.SignResponse.OptionalOutputs['sc.StepUpAuthorisationInfo']['sc.Result']['sc.ConsentURL'];
			} else {
				console.log("Using MobileID for Declaration of Will."); 
				consent_url = "NONE";
			}
	
			var pending = result.SignResponse.Result.ResultMajor;
			
			var pending_response = {	
				'url': consent_url,
				'id': response_id 
			};

			// Return consent url	
			resolve(pending_response);
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
		
		// Phone is undefined: hard-code mine	
		var phone = body.user.phoneNumber;
		if (phone == undefined) {
			console.log("Phone Number undefined - getting fix configured one.");	
			phone = info_tmp.user.phoneNumber;
		}

		// console.log("- Phone: " + phone);
		var dn = 'cn=TEST ' + body.user.displayName + ', o=Swisscom (Schweiz) AG, c=CH, ou=Certificate and signatures for test purpose only';

		// console.log("- DN: " + dn);
	
		var json = getJsonRequest(config.claimedIdentity, dn, phone, name, hash);
		var data_length = Buffer.byteLength(JSON.stringify(json));	
		var sign_options = getOptions(data_length, false);

        	var sign_req = https.request(sign_options, function(sign_res){
       			sign_res.setEncoding('utf8');
                	var body = '';
                	sign_res.on('data', function(chunk) {
                        	body += chunk;
                	});

                	sign_res.on('end', function() {
				//console.log("Body: " + body);
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

		var json = getPendingJsonRequest(config.claimedIdentity, responseID);
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

					if (pending_result != pending_string) {
						console.log("Success!");
						resolve(sign_response.SignatureObject.Base64Signature.$);
					} else {
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
	var config = require('./config');
	var ais_url = poll ? url.parse(config.aisUrlPending) : url.parse(config.aisUrl);

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
		key: fs.readFileSync('ssl/mycert-preprod.key'),
		cert: fs.readFileSync('ssl/mycert-preprod.pem'),
		ca: fs.readFileSync('ssl/ais-ca-ssl-pp.pem')
	};
	return sign_options;
}

function getJsonRequest(claimedIdentity, dn, phone, name, hash) {

	var now = new Date();

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
                                                "sc.Message": "DocuSign: sign " + name + "?",
                                                "sc.Language": "EN"
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
		// "dsig.DigestValue": "1WON4H3Hrinf7LYRNmhV6Uf7apdUvuYEsmhxAklxumA=" 
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
