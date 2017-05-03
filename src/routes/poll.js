"use strict";

const express = require('express');


module.exports = () => {
    const router = express.Router();

    router.get('/poll', (req, res) => {
        res.send('poll test');
    });

    return router;
};
