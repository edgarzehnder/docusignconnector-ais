'use strict';

var express = require('express');
var signrequest = require('./signrequest');
var dsrequest = require('./dsrequest');
var dsoauth = require('./oauth');
var app = express();
var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || '8081';
var util = require('util');

var info;
var user;
var accessToken;
var api;

// First redirect: DocuSign Authorization Service redirects user request with authorization code 
app.get('/dsconnector', function(req, res) {

	console.log('/dsconnector');

	//  OAuth2 Authentication
	var result = dsoauth.getOAuthToken(req.query.code);

	result.then(function(result) {
	
		console.log("Authorization result: " + result);
		
		console.log("=====> POST request getSignInfo() to DocuSign...");
	
		// Parse response and extract access token
		var body = JSON.parse(result);
		accessToken = body.access_token;
		api = body.user_api;		

		// GET getSignHashSessionInfo
		return dsrequest.getSignInfo(accessToken, api);
	
	}).then(function(result) {

		// If succesfull, the GET result will contain then sign info
		if (result != undefined) {
			info = result;
		}
	
		console.log("=====> GET request getUserInfo() to DocuSign...");
			
		// TEST: getUserInfo()
		return dsrequest.getUserInfo(accessToken, api);

	}).then(function(result) {

		console.log("=====> Sign request (async) to All-In Signing...");
		console.log(result);
	
		// AIS Signing Request	
		return signrequest.signpwdotp(info); 
	
	}, function(error) {
		console.log("Error: " + error);

	}).then(function(result) {

		// If PwdOTP, open consentURL
		// Redirect to polling location
		if (result.url != "NONE") {
			console.log("PwdOTP");
			var html = "<script>window.open('" + result.url + "'); window.location='https://lab-pki.swisscom.com/poll?id=" + result.id + "'</script>";
			res.end(html);

		} else {
			console.log("MobileID");
			res.writeHead(302, {
				'Location': 'https://lab-pki.swisscom.com/poll?id=' + result.id	
			});
			res.end();
		}
	});
});

// Second redirect: self-redirect to poll location, after sending signing request and opening consent URL
app.get('/poll', function(req, res) {

	console.log('/poll');

	var id = req.query.id;
	console.log("=====> Pending request (polling) to All-In Signing...");
	
	// Start the polling
	var result = signrequest.pending(id, 0);

	result.then(function(result) {

		var signature = result;

		console.log(signature);

		// POST completeSignHashInfo
		var result = dsrequest.postCompleteSignInfo(accessToken, api, signature, info);	

		result.then(function(result) {
	
			console.log(result);
	
			// Redirect to post-signing URL
			var redirectionUrl = JSON.parse(result).redirectionUrl;
			// console.log("Redirection URL: " + redirectionUrl);	
			res.writeHead(302, {
				'Location': redirectionUrl
			});
			res.end();
		});	
	});

	result.catch(function(err) {
		res.write("Timeout: signature failed.");
		res.send();
	});
});

//  Start server
app.listen(port, host, function() {
  console.log('AIS DocuSign Connector listening on port %s', port);
});


