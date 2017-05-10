"use strict";

const winston = require('winston');

// require('winston-logstash');
// /**
//  * ELK Integration
//  */
// if (process.env.name === 'production') {
//     winston.add(winston.transports.Logstash, {
//         node_name: process.env.APP_LOGGER_REMOTE_NODE_NAME,
//         host: process.env.APP_LOGGER_REMOTE_HOST,
//         port: process.env.APP_LOGGER_REMOTE_PORT
//     });
// }

/**
 * Basic winston logger configuration
 */
const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: process.env.APP_LOGGER_LEVEL,
            timestamp: (process.env.name === 'production'),
            handleExceptions: (process.env.name === 'production'),
            json: (process.env.name === 'production'),
            colorize: (process.env.name !== 'production')
        })
    ],
    exitOnError: false
});

module.exports = logger;
