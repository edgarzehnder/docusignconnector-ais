"use strict";

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const compression = require('compression');

const bootstrap = require('./core/bootstrap');
const log = require('./core/logger');
const docuSignRouter = require('./routes/docu-sign-connector');
const pollRouter = require('./routes/poll');
const statusRouter = require('./routes/status-monitor');


// Configure our app
const app = bootstrap()
    // Enables GZIP compression
    .use(compression())
    // HTTP request logger middleware for node.js
    .use(morgan('combined', {
        stream: {
            write: (message) => {
                log.info(message);
            }
        }
    }))
    // Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    // Serve static files such as images
    .use(express.static(`${__dirname}/public`))
    .use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
    // Define our routes
    .use(docuSignRouter())
    .use(pollRouter())
    .use(statusRouter());

module.exports = app;
