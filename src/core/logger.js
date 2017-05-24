"use strict";

const winston = require('winston');

/**
 * ELK Integration
 */
if (process.env.NODE_ENV === 'production') {
    require('winston-logstash');
    const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
    const elk = vcapServices.elk[0].credentials;

    winston.add(winston.transports.Logstash, {
        node_NODE_ENV: process.env.APP_LOGGER_REMOTE_NODE_NAME,
        host: elk.logstashHost,
        port: elk.logstashPort
        // host: process.env.APP_LOGGER_REMOTE_HOST,
        // port: process.env.APP_LOGGER_REMOTE_PORT
    });
}

/**
 * Basic winston logger configuration
 */
const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: process.env.APP_LOGGER_LEVEL,
            timestamp: (process.env.NODE_ENV === 'production'),
            handleExceptions: (process.env.NODE_ENV === 'production'),
            json: (process.env.NODE_ENV === 'production'),
            colorize: (process.env.NODE_ENV !== 'production')
        })
    ],
    exitOnError: false
});

module.exports = logger;
