var Promise = require('promise');
var request = require('request');
var config = require('./config/config');
var util = require('util');

function getUserInfo(accessToken, api) {

	return new Promise(function(resolve, reject) {

		// If user undefined return error
		if (accessToken == 'undefined') {
			reject("OAuth access token undefined.");
		}

		//var post_body = {}

		var options = {
                        url: api + '/restapi/v2/signature/userinfo',
                        method: 'GET',
                        headers: {
                                'Authorization': 'Bearer ' + accessToken,
                                'Content-Type': 'application/json; charset=utf-8'
                        }
                       // body: JSON.stringify(post_body)
                }
		console.log("Request getUserInfo(): " + util.inspect(options));

                request(options, function(error, response, body) {

                        console.log("-----> DS Response GET userInfo " + body);

                        if (!error && response.statusCode == 200) {
                                // console.log(body);
                                resolve(body);
                        } else {
                                console.log(error);
                                reject(error);
                        }
                });
	});
}


function getSignInfo(accessToken, api) {

	return new Promise(function(resolve, reject) {

		// If user undefined return error
		if (accessToken == 'undefined') {
			reject("OAuth access token undefined.");
		}
	
		// Empty body, otherwise the service does not accept the request
		var post_body = {}

		var options = {
			url: api + '/restapi/v2/signature/signHashSessionInfo',
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + accessToken,
				'Content-Type': 'application/json; charset=utf-8'
			},
			body: JSON.stringify(post_body)
		}

		console.log("Request: " + util.inspect(options));

		// GET request to DS API	
		request(options, function(error, response, body) {
		
			console.log("Body: " + body);
	
			if (!error && response.statusCode == 200) {
				// console.log(body);
				resolve(body);
			} else {
				console.log(error);
				reject(error);
			}
		});
	});
}

function postCompleteSignInfo(accessToken, api, signature, info) {

	return new Promise(function(resolve, reject) {

		// console.log("---> accessToken: " + accessToken);
		// console.log("---> api: " + api);
		// console.log("---> signature: " + signature);
		// console.log("info: " + info);

		var json = JSON.parse(info);

		if (accessToken == 'undefined' || info == 'undefined') {
			reject("OAuth access token or POST info undefined.");
		}

		var post_body = {
			'documentUpdateInfos': [ 
				{
				'data': signature,
				'documentId': json.documents[0].documentId,
				'returnFormat': 'CMS'
				}
			]
		}

		var options = {
                        url: api + '/restapi/v2/signature/completeSignHash',
                        method: 'POST',
                        headers: {
                                'Authorization': 'Bearer ' + accessToken,
                                'Content-Type': 'application/json; charset=utf-8'
                        }, 
			body: JSON.stringify(post_body)
                }

		// POST request to DS API	
		request(options, function(error, response, body) {

			if (!error && response.statusCode == 200) {
				resolve(body);
			} else {
				reject(response.statusCode);
			}
		});
	});
}

module.exports={
	getUserInfo: getUserInfo,	
	getSignInfo: getSignInfo,
	postCompleteSignInfo: postCompleteSignInfo
}

