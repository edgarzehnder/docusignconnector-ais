"use strict";

const express = require('express'),
    pem = require('pem'),
    fs = require('fs'),
    log = require('../core/logger');
/**
 * Normalize a port into a number, string, or false.
 */
const normalizePort = (port) => {
    const parsedPort = parseInt(port, 10);
    if (isNaN(parsedPort)) { // named pipe
        return port;
    }
    if (parsedPort >= 0) { // port number
        return parsedPort;
    }
    return false;
};

/**
 * Bootstrap function to create a new express.js app with
 * some configurations like port and path
 */
module.exports = () => {

    // Create a new express app
    const app = express();

    // Set config values to the express app
    app.set('url', process.env.APP_URL);
    app.set('port', normalizePort(process.env.PORT || process.env.APP_PORT));

    //read keys from files
    pem.readPkcs12(process.env.P12_PATH, {
        p12Password: process.env.P12_PASSWORD
    }, (error, response) => {
        if (error === null) {
            process.env.AIS_SSL_KEY = response.key;
            process.env.AIS_SSL_CERT = response.cert;
        } else {
            error = error.message.split('\n').splice(2,2).toString().split(",").join("\n");
            log.error(error);
            process.exit(1);
        }
    });

    //read ca from pem-file
    try {
        process.env.AIS_CA = fs.readFileSync(process.env.CA_PATH);
    } catch (error) {
        log.error(error);
        process.exit(1);
    }

    return app;
};
