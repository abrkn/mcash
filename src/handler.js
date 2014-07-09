var crypto = require('crypto')
var debug = require('debug')('mcash:handler')
var format = require('util').format
var EventEmitter = require('events').EventEmitter

module.exports = exports = function(environment, callbackUri) {
    return require('body-parser').json({
        type: 'application/vnd.mcash.api.merchant.v1+json',
        verify: function(req, res, buf, encoding) {
            var err = exports.verifyDigest(req, buf.toString('utf8'))
            if (err) throw new Error('Digest verification failed: ' + err)

            err = exports.verifyAuthorization(req, exports.KEYS[environment], callbackUri)
            if (err) throw new Error('Authorization verification failed: ' + err)
        }
    })
}

exports.KEYS = require('../keys.json')

exports.verifyDigest = function(req, text) {
    var header = req.headers['x-mcash-content-digest']
    if (!header) return 'header missing'

    // Split "SHA256=abcdefg" by =
    var match = header.match(/^([^=]+)=(.+)$/)
    if (!match) return 'invalid header format'

    var algo = match[1]
    if (algo != 'SHA256') return 'unexpected algo'

    var expected = match[2]

    debug('digest of %s', text)

    var actual = crypto.createHash('sha256').update(text || '').digest('base64')
    debug('expected: %s\nactual: %s', expected, actual)

    if (actual != expected) return 'mismatch'
}

exports.verifyAuthorization = function(req, key, callbackUri) {
    var header = req.headers['authorization']
    if (!header) return 'header missing'

    // Split "RSA-SHA256 abcde" by whitespace
    var match = header.match(/^([^ ]+) (.+)$/)
    if (!match) return 'invalid header format'

    var algo = match[1]
    if (algo != 'RSA-SHA256') return 'unexpected algo'

    var expected = match[2]

    if (!callbackUri) {
        callbackUri = format('%s://%s%s', req.protocol, req.headers.host, req.originalUrl)
    }

    // POST|http://server.test/some/resource/|X-MCASH-CONTENT-DIGEST=SHA256=oWVxV3hh...
    var concat = format('%s|%s|%s',
        req.method,
        callbackUri,
        Object.keys(req.headers).filter(function(key) {
            return !!key.match(/^x-mcash-/)
        }).sort().reduce(function(p, key) {
            return format('%s%s%s=%s',
                p,
                p.length ? '&' : '',
                key.toUpperCase(),
                req.headers[key])
        }, '')
    )

    debug('concat:\n%s', concat)

    debug('key:\n%s', key)
    debug('expected: %s', expected)

    var verifier = crypto.createVerify('RSA-SHA256')
    verifier.update(concat)

    if (!verifier.verify(key, expected, 'base64')) {
        return 'signature mismatch'
    }
}
