const qs = require('querystring');
const request = require('request');
const log = require('./core/logger');

/**
 * DocuSignService
 * -----------------------
 * Here are all possible endpoints we use from DocuSign.
 */
module.exports = {

    /**
     * Gets the oauth access token from DocuSign
     */
    getOAuthToken: (authorizationCode) => {
        return new Promise((resolve, reject) => {
            const integratorKey = process.env.INTEGRATOR_KEY;
            const secretKey = process.env.SECRET_KEY;
            const secretKeyInBase64 = new Buffer(integratorKey + ':' + secretKey).toString('base64');

            const payload = {
                grant_type: 'authorization_code',
                code: authorizationCode,
                redirection_uri: process.env.DS_OAUTH_REDIRECTION_URI
            };

            log.info('Requesting access token');
            request({
                url: process.env.DS_OAUTH_TOKEN_PATH,
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + secretKeyInBase64,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: qs.stringify(payload)
            }, (error, response, body) => {
                if (!error && response.statusCode === '200') {
                    log.info('Got access token');
                    body = JSON.parse(body);
                    resolve({
                        auth: {
                            token: body.access_token,
                            link: body.user_api
                        }
                    });
                } else {
                    log.error('Failed requesting the access token from DocuSign', error);
                    reject(body);
                }
            });

        });
    },

    /**
     * This provides signing session information for a Trust Service Provider (TSP). This method
     * is used by TSPs that are not taking actions on the documents, but only providing the signing hash.
     */
    getSignInfo: (context) => {
        return new Promise((resolve, reject) => {
            log.info('Got access token');
            request({
                url: context.auth.link + process.env.DS_API_SIGN_HASH_SESSION_INFO,
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + context.auth.token,
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }, function (error, response, body) {
                if (!error && response.statusCode === '200') {
                    log.info('Got session info from DocuSign');
                    context.sessionInfo = body;
                    resolve(context);
                } else {
                    log.error('Failed at getting session infos', error);
                    reject(error);
                }
            });
        });
    },

    /**
     *
     */
    postCompleteSignInfo: (token, uri, signature, info) => {

    }

};
