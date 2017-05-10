"use strict";

/**
 * Load .env file into the process.env object
 */
require('dotenv').config();

/**
 * Module dependencies.
 */
const app = require('./app');
const log = require('./core/logger');
const server = app.listen(app.get('port'));

/**
 * Event listener for HTTP server "listening" event.
 */
server.on('listening', () => {
    log.info(`started on ${app.get('url')}`);
});

/**
 * Event listener for HTTP server "error" event.
 */
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const addr = server.address();
    switch (error.code) {
        case 'EACCES':
            log.error(`${this.bind(addr)} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log.error(`${this.bind(addr)} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});
