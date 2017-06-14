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
            colorize: (process.env.NODE_ENV !== 'production')
        })
    ],
    exitOnError: false
});

function addTenantId(value) {
    return '[' + process.env.TENANT_ID + '] ' + value;
}

module.exports = {
    debug: function (...args) {
        args[0] = addTenantId(args[0]);
        logger.debug(...args);
    },
    info: function (...args) {
        args[0] = addTenantId(args[0]);
        logger.info(...args);
    },
    warn: function (...args) {
        args[0] = addTenantId(args[0]);
        logger.warn(...args);
    },
    error: function (...args) {
        args[0] = addTenantId(args[0]);
        logger.error(...args);
    }
};
