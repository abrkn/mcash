/* global describe, it */
var expect = require('expect.js')
var Handler = require('../src/handler')
var mck = require('mck')

// From: http://dev.mca.sh/merchant/authentication.html#authentication-mcash-signatures
var testVectorReq1 = {
    originalUrl: '/some/resource/',
    method: 'POST',
    protocol: 'http',
    host: 'server.test',
    headers: {
        'host': 'server.test',
        'accept': 'application/vnd.mcash.api.merchant.v1+json',
        'content-type': 'application/json',
        'x-mcash-merchant': 'T9oWAQ3FSl6oeITuR2ZGWA',
        'x-mcash-user': 'POS1',
        'x-mcash-timestamp': '2013-10-05 21:33:46',
        'x-mcash-content-digest': 'SHA256=oWVxV3hhr8+LfVEYkv57XxW2R1wdhLsrfu3REAzmS7k=',
        'authorization': 'RSA-SHA256 p8+PdS5dDa6Ig46jNQhE8qQR+J8rRgX77cyXN3EIvUqpQ2lB8Cz1bcUF6lwvdVbz4NSUIQD/OCT8X2WtqRNbPW+5DDzGC1TytiV6p0EXiMOAl7s6kioHnVGaiCSHyfO6ZYB7ubtcMtUE0+7OEUcPeaqSHeL4wwUkO8W0+euwGsfwl9gOoQHBFIOh0bh8z3JNGhUeIZM8fvrk+8kj/s2A70IBvUOLwcFeP8uf6gTi1fz7BtgJ5rHmfvn9HvrsyO53/nx2mXZdAap4MfOZa6dp0ievZ5kU1vEfB2R6f4uPHzKLnaePlDOQMTk+uHlxU0ChkSqenbgJvpGuaOGiQekwsA=='
    },
    text: '{"text": "Hello world"}',
    body: JSON.parse('{"text": "Hello world"}')
}

describe('verifyDigest', function() {
    it('passes test vector from docs', function() {
        var err = Handler.verifyDigest(testVectorReq1, testVectorReq1.text)
        if (err) throw new Error(err)
    })
})

describe('verifyAuthorization', function() {
    it('passes test vector from docs', function() {
        var err = Handler.verifyAuthorization(testVectorReq1, Handler.KEYS.sample)
        if (err) throw new Error(err)
    })
})

describe('handler', function() {
    it('calls verifiers', function(done) {
        var handler = Handler('sample')

        var digest = mck.once(Handler, 'verifyDigest', function(req) {
            expect(req).to.be(testVectorReq1)
        })

        var auth = mck.once(Handler, 'verifyAuthorization', function(req, key) {
            expect(req).to.be(testVectorReq1)
            expect(key).to.be(Handler.KEYS.sample)
        })

        handler(testVectorReq1, null, function() {
            expect(digest.invokes).to.be(1)
            expect(auth.invokes).to.be(1)
            done()
        })
    })
})
