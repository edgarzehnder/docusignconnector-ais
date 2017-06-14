const PENDING_STRING = "urn:oasis:names:tc:dss:1.0:profiles:asynchronousprocessing:resultmajor:Pending";
const SUCCESS_STRING = "urn:oasis:names:tc:dss:1.0:resultmajor:Success";
const ERROR_STRINGS = [
    "urn:oasis:names:tc:dss:1.0:resultmajor:RequesterError",
    "urn:oasis:names:tc:dss:1.0:resultmajor:ResponderError",
    "http://ais.swisscom.ch/1.0/resultmajor/SubsystemError"
];

/**
 * AISService
 * -----------------------
 * Here are all the sign and pending process of the ais service
 */
module.exports = function (request, log, dateFormat, sleep) {
    return {

        /**
         * Sign process of the AIS service
         */
        sign: (context) => {
            return new Promise(function (resolve, reject) {
                const phone = parsePhone(context.sessionInfo);
                // Credentials type "sms" SHOULD BE included in the user object
                if (phone === undefined) {
                    log.warn('No phone number was given!');
                    return reject('No phone number was given!');
                }
                // Build the DN, with the user name in the DS response and the configured values
                const prefix = process.env.CN_PREFIX ? process.env.CN_PREFIX + ' ' : '';
                const dn = 'cn=' + prefix + context.sessionInfo.user.displayName + ', ' + process.env.DN_SUFFIX;
                const claimedIdentity = process.env.TENANT_ID + ':' + process.env.SIGNATURE_TYPE;
                // Support for multi-document (old getJsonRequest() supported only one document)
                const json = getSignRequest(claimedIdentity, dn, phone, context.sessionInfo.documents);

                log.info('Requesting sign process from ais');
                const options = {
                    url: process.env.AIS_HOST + '/sign',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8',
                        'Accept': 'application/json'
                    },
                    key: process.env.AIS_SSL_KEY,
                    cert: process.env.AIS_SSL_CERT,
                    ca: process.env.AIS_CA,
                    body: JSON.stringify(json)
                };
                request(options, (error, response, body) => {
                    body = JSON.parse(body);
                    context.signInfo = body;

                    // Check if request was successful
                    if (!error && response.statusCode === 200) {
                        log.info('Successfully requested sign process');
                        // Verify if the ais service returned an error
                        if (ERROR_STRINGS.indexOf(body.SignResponse.Result.ResultMajor) > -1) {
                            const error = body.SignResponse.Result.ResultMajor + " -> " +
                                body.SignResponse.Result.ResultMinor + " -> " +
                                body.SignResponse.Result.ResultMessage.$;
                            log.warn('Failed requesting the sign process');
                            log.warn(error);
                            reject(error);
                        }

                        const responseID = body.SignResponse.OptionalOutputs['async.ResponseID'];

                        // Check if PwdOTP or MobileID (ConsentURL available or not)
                        const optionalOutputs = body.SignResponse.OptionalOutputs;

                        let consentURL;
                        if (optionalOutputs.hasOwnProperty('sc.StepUpAuthorisationInfo')) {
                            consentURL = body.SignResponse.OptionalOutputs['sc.StepUpAuthorisationInfo']['sc.Result']['sc.ConsentURL'];
                        } else {
                            consentURL = "NONE";
                        }

                        context.pendingResponse = {
                            id: responseID,
                            url: consentURL
                        };
                        resolve(context);
                    } else {
                        log.error('Failed requesting the sign process');
                        log.error(JSON.stringify(body));
                        reject(body);
                    }
                });
            });
        },

        pending: pending

    };


    /**
     * Poll process of the AIS service
     *
     * @param {string} responseID
     * @param {number} counter
     * @returns {Promise<>}
     */
    function pending(responseID, counter) {
        return new Promise(function (resolve, reject) {
            const claimedIdentity = process.env.TENANT_ID + ':' + process.env.SIGNATURE_TYPE;
            const json = getPendingJsonRequest(claimedIdentity, responseID);

            log.info('Wait to poll again. counter=', counter);
            const wait = (counter === 0) ? 0 : 10000;
            sleep.sleep(wait, () => {
                counter++;

                log.info('Requesting sign process from ais');
                request({
                    url: process.env.AIS_HOST + '/pending',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8',
                        'Accept': 'application/json'
                    },
                    key: process.env.AIS_SSL_KEY,
                    cert: process.env.AIS_SSL_CERT,
                    ca: process.env.AIS_CA,
                    body: JSON.stringify(json)
                }, (error, response, body) => {

                    if (!error && response.statusCode === 200) {
                        log.info('Successfully requested sign process');

                        const signResponseJson = JSON.parse(body);
                        var signResponse = signResponseJson.SignResponse;
                        var pendingResult = signResponse.Result.ResultMajor;

                        if (pendingResult !== PENDING_STRING) {
                            if (pendingResult !== SUCCESS_STRING) {
                                // No success and no pending: error
                                log.warn('No success and no pending');
                                reject("Error: " + signResponse.Result.ResultMinor);
                            } else {
                                log.info('Polling was successful');
                                resolve({
                                    signature: signResponse.SignatureObject
                                });
                            }
                        } else {
                            // Pending
                            if (counter === parseInt(process.env.AIS_PENDING_MAX_COUNT, 10)) {
                                log.warn('Polling was canceled due to reaching the timeout');
                                reject("Timeout!");
                            } else {
                                log.info('Pending... counter=' + counter);
                                resolve(pending(responseID, counter));
                            }
                        }

                    } else {
                        log.error('Failed requesting the sign process', error);
                        reject(body);
                    }
                });

            });

        });
    }

    /**
     * Returns the phone number of the given user credentials, but if there is
     * no phone number the return value is undefined
     *
     * @param {any} body
     * @returns {string} phone
     */
    function parsePhone(body) {
        if (body.user.hasOwnProperty('credentials') && body.user.credentials.length > 0) {
            let phone = body.user.credentials[0].value;
            // Number is a string in the form "+41 79 123 45 67"
            // Remove blanks
            phone = phone.replace(/\s/g, '');
            // Remove the '+'
            phone = phone.replace(/\+/g, '');
            return phone;
        }
        return;
    }

    /**
     * Generates the sign request payload and returns it
     *
     * @param {any} claimedIdentity
     * @param {any} dn
     * @param {any} phone
     * @param {any} documents
     * @returns {object} signRequestPayload
     */
    function getSignRequest(claimedIdentity, dn, phone, documents) {
        const dtbd = process.env.DTBD ? process.env.DTBD : 'Do you want to sign';
        const language = process.env.STEP_UP_LANG ? process.env.STEP_UP_LANG : 'en';

        // Name of the document displayed if only one document,
        // otherwise the number of documents is displayed
        let name;
        if (documents.length === 1) {
            name = documents[0].name;
        } else {
            // Multidocument
            name = '' + documents.length + ' documents';
        }

        const inputDocuments = documents.map((doc) => ({
            "@ID": doc.documentId,
            "dsig.DigestMethod": { "@Algorithm": "http://www.w3.org/2001/04/xmlenc#sha256" },
            "dsig.DigestValue": doc.data
        }));

        // Request (without input documents)
        let sign_request = {
            "SignRequest": {
                "@RequestID": dateFormat(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSZ"),
                "@Profile": process.env.AIS_PROFILE,
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
                                "sc.Message": dtbd + " " + name + "?",
                                "sc.Language": language
                            }
                        }
                    },
                    "AddTimestamp": { "@Type": "urn:ietf:rfc:3161" },
                    "sc.AddRevocationInformation": { "@Type": "BOTH" }
                },
                "InputDocuments": {
                    "DocumentHash": inputDocuments || []
                }
            }
        };

        // Additional Profile if batch request
        if (documents.length > 1) {
            sign_request.SignRequest.OptionalInputs.AdditionalProfile.push(process.env.AIS_BATCH_PROCESSING);
        }

        return sign_request;
    }

    /**
     * Builds and return the payload for the pending request
     *
     * @param {any} claimedIdentity
     * @param {any} responseID
     * @returns {object} payload
     */
    function getPendingJsonRequest(claimedIdentity, responseID) {
        return {
            "async.PendingRequest": {
                "@Profile": process.env.AIS_PROFILE,
                "OptionalInputs": {
                    "ClaimedIdentity": {
                        "Name": claimedIdentity
                    },
                    "async.ResponseID": responseID
                }
            }
        };
    }


};
