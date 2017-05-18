"use strict";

const qs = require('querystring');
const aisServiceMain = require('../src/services/docu-sign-service.js');


/**
 * getOAuthToken
 */
test('getOAuthToken should return the user api link and the access token into the context variable', () => {
    const requestMock = jest.fn((options, callback) => {
        process.nextTick(() =>
            callback(undefined,
                {
                    statusCode: '200'
                },
                '{ "access_token": "1234", "user_api": "/api/user" }')
        );
    });
    const logMock = {
        info: jest.fn(),
        error: jest.fn()
    };
    const service = aisServiceMain(requestMock, qs, logMock);
    return service.getOAuthToken(1234, {})
        .then((context) => {
            expect(logMock.info).toBeCalled();
            expect(context.auth.token).toBe('1234');
            expect(context.auth.link).toBe('/api/user');
        });
});

test('getOAuthToken should fail if the status code is not 200', () => {
    const requestMock = jest.fn((options, callback) => {
        process.nextTick(() =>
            callback(undefined,
                {
                    statusCode: '401'
                },
                '')
        );
    });
    const logMock = {
        info: jest.fn(),
        error: jest.fn()
    };
    const service = aisServiceMain(requestMock, qs, logMock);
    return service.getOAuthToken(1234, {})
        .catch((error) => {
            expect(error).toBe('');
            expect(logMock.error).toBeCalled();
        });
});

test('getOAuthToken should have a valid headers', () => {
    process.env.INTEGRATOR_KEY = 'i';
    process.env.SECRET_KEY = 's';
    const requestMock = jest.fn((options, callback) => {
        expect(options.headers['Authorization']).toBe('Basic aTpz');
        expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        process.nextTick(() =>
            callback(undefined,
                {
                    statusCode: '200'
                },
                '{ "access_token": "1234", "user_api": "/api/user" }')
        );
    });
    const logMock = {
        info: jest.fn(),
        error: jest.fn()
    };
    const service = aisServiceMain(requestMock, qs, logMock);
    return service.getOAuthToken(1234, {});
});

/**
 * getSignInfo
 */
test('getSignInfo should have valid headers', () => {
    process.env.DS_API_SIGN_HASH_SESSION_INFO = '/session-info';
    const requestMock = jest.fn((options, callback) => {
        expect(options.url).toBe('/user-api/session-info');
        expect(options.headers['Authorization']).toBe('Bearer abc.ok');
        expect(options.headers['Content-Type']).toBe('application/json; charset=utf-8');
        process.nextTick(() =>
            callback(undefined,
                {
                    statusCode: '200'
                },
                '{ "example": "json" }')
        );
    });
    const logMock = {
        info: jest.fn(),
        error: jest.fn()
    };
    const service = aisServiceMain(requestMock, qs, logMock);
    return service.getSignInfo({
        auth: {
            token: 'abc.ok',
            link: '/user-api'
        }
    });
});

test('getSignInfo should pass ', () => {
    const requestMock = jest.fn((options, callback) => {
        process.nextTick(() =>
            callback(undefined,
                {
                    statusCode: '200'
                },
                '{ "access_token": "1234", "user_api": "/api/user" }')
        );
    });
    const logMock = {
        info: jest.fn(),
        error: jest.fn()
    };
    const service = aisServiceMain(requestMock, qs, logMock);
    return service.getOAuthToken(1234, {})
        .then((context) => {
            expect(logMock.info).toBeCalled();
            expect(context.auth.token).toBe('1234');
            expect(context.auth.link).toBe('/api/user');
        });
});

test('getSignInfo should fail if the status code is not 200', () => {
    const requestMock = jest.fn((options, callback) => {
        process.nextTick(() =>
            callback('',
                {
                    statusCode: '401'
                },
                '{ "error": "example" }')
        );
    });
    const logMock = {
        info: jest.fn(),
        error: jest.fn()
    };
    const service = aisServiceMain(requestMock, qs, logMock);
    return service.getSignInfo({
        auth: {
            token: 'abc.ok',
            link: '/user-api'
        }
    })
        .catch((error) => {
            expect(error).toBe('{ "error": "example" }');
            expect(logMock.error).toBeCalled();
        });
});

/**
 * postCompleteSignInfo
 */
function testPostCompleteSignInfoFail(context) {
    const requestMock = jest.fn((options, callback) => {
        process.nextTick(() =>
            callback('',
                {
                    statusCode: '401'
                },
                '{ "example": "json" }')
        );
    });
    const logMock = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    };
    const service = aisServiceMain(requestMock, qs, logMock);
    return service.postCompleteSignInfo(context)
        .catch((error) => {
            expect(error).toBe('OAuth access token or POST info undefined.');
            expect(logMock.warn).toBeCalled();
        });
}

test('postCompleteSignInfo should fail if there is no access token', () => {
    testPostCompleteSignInfoFail({
        auth: {
            link: '/user-api'
        },
        sessionInfo: {
            example: true
        }
    });
});

test('postCompleteSignInfo should fail if there is no session info', () => {
    testPostCompleteSignInfoFail({
        auth: {
            token: '123.ok',
            link: '/user-api'
        },
    });
});

test('postCompleteSignInfo should fail if there is no session info and no access token', () => {
    testPostCompleteSignInfoFail({});
});

// test('postCompleteSignInfo should pass ', () => {
//     process.env.DS_API_COMPLETE_SIGN_HASH = '/test';
//     const requestMock = jest.fn((options, callback) => {
//         process.nextTick(() =>
//             callback(undefined,
//                 {
//                     statusCode: '200'
//                 },
//                 '{ "success": true }')
//         );
//     });
//     const logMock = {
//         info: jest.fn(),
//         error: jest.fn()
//     };
//     const service = aisServiceMain(requestMock, qs, logMock);
//     return service.postCompleteSignInfo({
//         auth: {
//             token: '123.ok',
//             link: '/user-api'
//         },
//         sessionInfo: {
//             documents: [
//                 {
//                     documentId: 'DocId',
//                     name: 'DocName'
//                 }
//             ]
//         },
//         signature: {
//             Base64Signature: {
//                 $: 'Base64Signature'
//             }
//         }
//     })
//         .then((body) => {
//             expect(logMock.info).toBeCalled();
//             expect(body.success).toBe(true);
//         });
// });
