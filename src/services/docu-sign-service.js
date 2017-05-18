/**
 * DocuSignService
 * -----------------------
 * Here are all possible endpoints we use from DocuSign.
 */
module.exports = function (request, querystring, log) {

    return {

        /**
         * Gets the oauth access token from DocuSign
         */
        getOAuthToken: (authorizationCode, context) => {
            return new Promise((resolve, reject) => {
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
                        'Authorization': 'Basic ' + buildAuthorizationHeader(),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: querystring.stringify(payload)
                }, (error, response, body) => {
                    if (!error && response.statusCode === '200') {
                        log.info('Got access token');
                        body = JSON.parse(body);
                        context.auth = {
                            token: body.access_token,
                            link: body.user_api
                        };
                        resolve(context);
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
                        context.sessionInfo = JSON.parse(body);
                        resolve(context);
                    } else {
                        log.error('Failed at getting session infos', error);
                        reject(body);
                    }
                });
            });
        },

        /**
         * This tells docusign that the signing process has finished
         */
        postCompleteSignInfo: (context) => {
            return new Promise(function (resolve, reject) {
                if ((context.auth && context.auth.token === undefined) || context.sessionInfo === undefined) {
                    log.warn('OAuth access token or POST info undefined.');
                    reject('OAuth access token or POST info undefined.');
                }

                var postBody = {
                    'documentUpdateInfos': []
                    /*
                    'documentUpdateInfos': [
                        {
                        'data': signature,
                        'documentId': json.documents[0].documentId,
                        'returnFormat': 'CMS'
                        }
                    ]*/
                };
                // Multi-document support
                if (context.sessionInfo.documents.length === 1) {
                    // One document
                    postBody.documentUpdateInfos = [
                        {
                            'name': context.sessionInfo.documents[0].name,
                            'data': context.signature.Base64Signature.$,
                            'documentId': context.sessionInfo.documents[0].documentId,
                            'returnFormat': 'CMS'
                        }
                    ];

                } else {
                    // Several documents
                    context.signatures = context.signature.Other["sc.SignatureObjects"]["sc.ExtendedSignatureObject"];
                    for (var i = 0; i < context.sessionInfo.documents.length; i++) {
                        postBody.documentUpdateInfos[i] = {
                            'name': context.sessionInfo.documents[i].name,
                            'data': context.signatures[i].Base64Signature.$,
                            'documentId': context.sessionInfo.documents[i].documentId,
                            'returnFormat': 'CMS'
                        };
                    }
                }
                // POST request to DS API
                request({
                    url: context.auth.link + process.env.DS_API_COMPLETE_SIGN_HASH,
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + context.auth.token,
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    body: JSON.stringify(postBody)
                }, function (error, response, body) {
                    body = JSON.parse(body);
                    if (!error && response.statusCode === 200) {
                        log.info('Successfully complete sign hash');
                        resolve(body);
                    } else {
                        log.error('Failed to complete sign hash!', error);
                        reject(body);
                    }
                });


            });
        }
    };

    /**
     * Return the basic token for the get token request
     *
     * @returns {string} basic token
     */
    function buildAuthorizationHeader() {
        const integratorKey = process.env.INTEGRATOR_KEY;
        const secretKey = process.env.SECRET_KEY;
        return new Buffer(integratorKey + ':' + secretKey).toString('base64');
    }
};
