"use strict";

const express = require('express');
const docuSignService = require('../services/docu-sign-service');
const aisService = require('../services/ais-service');


module.exports = () => {
    const router = express.Router();

    router.get('/dsconnector', (req, res) => {

        // OAuth2 Authentication
        docuSignService
            .getOAuthToken(req.query.code)
            .then((context) => docuSignService.getSignInfo(context))
            .then((context) => aisService.signpwdotp(context))


            .then((context) => {
                res.send(context);
            })
            .catch((error) => {
                res.status(500).send(error);
            });

    });

    return router;
};
