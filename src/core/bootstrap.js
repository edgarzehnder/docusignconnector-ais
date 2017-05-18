"use strict";

const express = require('express');

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

    return app;
};


