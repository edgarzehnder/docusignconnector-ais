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
 * /poll
 * -----------------------
 * Endpoint for polling the signing process of the AIS service
 */
module.exports = () => {
    const router = express.Router();

    router.get('/poll', (req, res) => {
        const id = req.query.id;

        if (!req.query.id || !req.query.code) {
            log.warn('Query parameter code and id are missing!');
            return res.status(400).send('Query parameter code and id are missing!');
        }

        /**
         * Start the polling
         *
         * context {
         *     auth: {
         *        token: string,
         *        link: string
         *     },
         *     sessionInfo: object,
         *     signature: object,
         *     redirectionUrl: string
         * }
         */
        log.info('Pending request (polling) to All-In Signing for id=', id);
        aisService.pending(id, 0)
            .then((context) => docuSignService.getOAuthToken(req.query.code, context))
            .then((context) => docuSignService.getSignInfo(context))
            .then((context) => docuSignService.postCompleteSignInfo(context))
            .then((context) => {
                // Redirect to post-signing URL
                log.info('Redirecting to ', context.redirectionUrl);
                res.writeHead(302, {
                    'Location': context.redirectionUrl
                });
                res.end();
            })
            .catch((error) => {
                res.status(500).json(JSON.parse(error));
            });
    });

    return router;
};
