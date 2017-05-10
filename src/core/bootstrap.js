"use strict";

const express = require('express');
const config = require('../config');


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

module.exports = () => {

    // Create a new express app
    const app = express();

    // Set config values to the express app
    app.set('url', config.app.url);
    app.set('port', normalizePort(config.app.port));

    return app;
};


