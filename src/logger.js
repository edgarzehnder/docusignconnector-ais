"use strict";

const winston = require('winston');
const config = require('./config');


// require('winston-logstash');
// ELK Integration
// if (config.env === 'production') {
//     winston.add(winston.transports.Logstash, {
//         node_name: config.logger.node_name,
//         host: config.logger.host,
//         port: config.logger.port
//     });
// }


const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: config.logger.level,
            timestamp: (config.env === 'production'),
            handleExceptions: (config.env === 'production'),
            json: (config.env === 'production'),
            colorize: (config.env !== 'production')
        })
    ],
    exitOnError: false
});

module.exports = logger;
