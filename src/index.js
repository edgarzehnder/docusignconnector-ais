"use strict";

const app = require('./app');
const log = require('./logger');
const server = app.listen(app.get('port'));


// Listen on server events
server.on('listening', () => {
    log.info(`started on ${app.get('url')}`);
});

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
