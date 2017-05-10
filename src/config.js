"use strict";

const cfenv = require('cfenv');

const appEnv = cfenv.getAppEnv();
// const elkService = appEnv.getService('ds-elk');


module.exports = {
    /**
     * Node JS environment
     */
    env: process.env.NODE_ENV,
    /**
     * Basic configuration for our connector
     */
    app: {
        url: appEnv.url,
        port: appEnv.port,
    },
    /**
     * Logging configurations
     */
    logger: {
        level: 'debug'
        // node_name: 'ds-connector-dev',
        // host: elkService.credentials.logstashHost,
        // port: elkService.credentials.logstashPort
    },
    /**
     * DocSign options
     */
    docSign: {

    },
    /**
     * AIS options
     */
    ais: {

    }
};
