"use strict";

const express = require('express');
const qs = require('querystring');
const dateFormat = require('date-format');
const request = require('request');
const sleep = require('sleep-async')();
const log = require('../core/logger');

const docuSignService = require('../services/docu-sign-service')(request, qs, log);
const aisService = require('../services/ais-service')(request, log, dateFormat, sleep);


/**
 * /dsconnector
 * -----------------------
 * Endpoint to start signing a new document
 */
module.exports = () => {
    const router = express.Router();

    router.get('/dsconnector', (req, res) => {

        /**
         * OAuth2 Authentication
         *
         * context {
         *     auth: {
         *        token: string,
         *        link: string
         *     },
         *     sessionInfo: object,
         *     signInfo: object,
         *     pendingResponse: {
         *         id: string,
         *         url: string,
         *     }
         * }
         */
        docuSignService
            .getOAuthToken(req.query.code)
            .then((context) => docuSignService.getSignInfo(context))
            .then((context) => aisService.sign(context))
            .then((context) => {
                //pendingResponse
                // Connector URL set as environment variable (default: development)
                const tspUrl = process.env.TSP_URL || "https://lab-pki.swisscom.com";

                // If PwdOTP, open consentURL
                // Redirect to polling location
                if (context.pendingResponse.url !== "NONE") {
                    log.info('Using PwdOTP as Declaration of Will method.');
                    const html = "<script>window.open('" + context.pendingResponse.url + "'); window.location='" + tspUrl + "/poll?id=" + context.pendingResponse.id + "'</script>";
                    res.end(html);

                } else {
                    log.info('Using MID as Declaration of Will method.');
                    res.writeHead(302, {
                        'Location': tspUrl + '/poll?id=' + context.pendingResponse.id + '&code=' + req.query.code
                    });
                    res.end();
                }
            })
            .catch((error) => {
                res.status(500).json(JSON.parse(error));
            });

    });

    return router;
};
