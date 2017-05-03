"use strict";

const express = require('express');


module.exports = () => {
    const router = express.Router();

    router.get('/dsconnector', (req, res) => {
        res.send('dsconnector test');
    });

    return router;
};
