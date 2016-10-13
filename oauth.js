'use strict';

var util = require('util');
var Promise = require('promise');
var qs = require('querystring');
var request = require('request');
var config = require('./config');
var debug = require('debug')('http');

function getOAuthToken(authorization_code) {

	return new Promise(function(resolve, reject) {

		var secret_key_base64 = new Buffer('3dacc143-d581-4bf8-b433-6b487f33876d:3e29f10c-e05e-451f-8526-613cb326acbe').toString('base64');

                var my_body = {
                        grant_type: 'authorization_code',
                        code: authorization_code,
                        redirection_uri: 'https://lab-pki.swisscom.com/callback'
                }
		// What is actually the redirection uri used for?!

                var options = {
                        url: config.tokenServiceUrl,
                        method: 'POST',
                        headers: {
                                'Authorization': 'Basic ' + secret_key_base64,
                                'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: qs.stringify(my_body)
                };

		// POST request to Token Service to exchange authorization code through access token
                var my_request = request(options, function(error, response, body) {

                        if (response.statusCode == "200") {
				resolve(body);
                        } else {
                                reject(body);
                        }
                });	
		debug('Authentication request: %s', my_request);
        });
};

module.exports = {
	getOAuthToken: getOAuthToken
}
