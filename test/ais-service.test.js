"use strict";

const sleep = require('sleep-async')();
const dateFormat = require('date-format');
const aisServiceMain = require('../src/services/ais-service.js');



/**
 * sign
 */
test('sign should pass', () => {
    const requestMock = jest.fn((options, callback) => {
        process.nextTick(() =>
            callback(undefined,
                {
                    statusCode: 200
                },
                '{ "access_token": "1234", "user_api": "/api/user" }')
        );
    });
    const logMock = {
        info: jest.fn(),
        error: jest.fn()
    };
    const service = aisServiceMain(requestMock, logMock, dateFormat, sleep);
    return service.getOAuthToken(1234, {})
        .then((context) => {
            expect(logMock.info).toBeCalled();
            expect(context.auth.token).toBe('1234');
            expect(context.auth.link).toBe('/api/user');
        });
});

/**
 * pending
 */
