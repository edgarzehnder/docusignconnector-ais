var Promise = require('promise');
var request = require('request');
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
		// console.log("Request getUserInfo(): " + util.inspect(options));

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

		// console.log("Request: " + util.inspect(options));

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

		if (accessToken == 'undefined' || info == 'undefined') {
			reject("OAuth access token or POST info undefined.");
		}
		
		if (signature.hasOwnProperty('Base64Signature')) {

		} 



		var json = JSON.parse(info);

		var post_body = {
			'documentUpdateInfos': []
			/*	
			'documentUpdateInfos': [ 
				{
				'data': signature,
				'documentId': json.documents[0].documentId,
				'returnFormat': 'CMS'
				}
			]*/
		}

		// Multi-document support
		if (json.documents.length == 1) {
			// One document
			post_body.documentUpdateInfos = [
				{
				'name': json.documents[0].name,
                                'data': signature.Base64Signature.$,
                                'documentId': json.documents[0].documentId,
                                'returnFormat': 'CMS'
                                }
			]
	
		} else {

			// Several documents
			signatures = signature.Other["sc.SignatureObjects"]["sc.ExtendedSignatureObject"];

			//console.log("Signatures: " + util.inspect(signatures, 'false', null));
	
			for (var i = 0; i < json.documents.length; i++) {
				post_body.documentUpdateInfos[i] = {
					'name': json.documents[i].name,
					'data': signatures[i].Base64Signature.$,
					'documentId': json.documents[i].documentId,
					'returnFormat': 'CMS' 
				}	
			}
			//console.log("Post_body: " + util.inspect(post_body));
		
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

