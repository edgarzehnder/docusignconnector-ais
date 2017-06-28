"use strict";

const cfenv = require('cfenv');
const express = require('express');
const statusMonitor = require('express-status-monitor')({
    title: 'Monitor',
    path: ''
});

/**
 * /monitor
 * -----------------------
 * Endpoint to express-status-monitor
 */
module.exports = () => {
    const router = express.Router();

    router.use(statusMonitor);

    if ((process.env.APP_MONITOR_ACTIVE === 'true' && cfenv.getAppEnv().isMonitorEnabled !== 'false') ||
        cfenv.getAppEnv().isMonitorEnabled === 'true') {

        router.get('/monitor', statusMonitor.pageRoute);
    } else {
        router.get('/monitor', (req, res) => {
            res.sendStatus(503);
        });
    }

    return router;
};
