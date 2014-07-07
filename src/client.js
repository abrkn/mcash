var superagent = require('superagent')
var crypto = require('crypto')
var debug = require('debug')('mcash')
var format = require('util').format
var CONTENT_TYPE = 'application/vnd.mcash.api.merchant.v1+json'
var lodash = require('lodash')
var parseUrl = require('url').parse

superagent.parse[CONTENT_TYPE] = superagent.parse['application/json']

var Mcash = module.exports = exports = function(opts) {
    this.opts = opts
}

exports.ENDPOINTS = {
    production: 'https://api.mca.sh/merchant/v1/',
    test: 'https://mcashtestbed.appspot.com/merchant/v1/'
}

function mcashTimestamp() {
    return new Date().toISOString().replace(/T/, ' ').substr(0, 19)
}

Mcash.prototype.request = function(type, url, opts) {
    var fn = superagent[type.toLowerCase()]

    opts = lodash.extend({
        payload: null
    }, opts)

   var request = fn(exports.ENDPOINTS[this.opts.environment] + url)
    // var request = fn('http://httpbin.org/post')
    .buffer(true)
    .parse(superagent.parse.json)
    .set('Accept', 'application/vnd.mcash.api.merchant.v1+json')
    .set('X-Mcash-Merchant', this.opts.merchantId)
    .set('X-Mcash-User', this.opts.user)

    if (this.opts.environment == 'test') {
        request = request.set('X-Testbed-Token', this.opts.testbedToken)
    }

    if (this.opts.secret) {
        request = request
        .set('Authorization', 'SECRET ' + this.opts.secret)
    } else if (this.opts.privateKey) {
        var payload = opts.payload ? JSON.stringify(opts.payload) : ''
        debug('payload (post data) is:\n%s', payload)
        var digest = crypto.createHash('sha256').update(payload).digest('base64')

        request = request
        .set('X-Mcash-Timestamp', mcashTimestamp())
        .set('X-Mcash-Content-Digest', 'SHA256=' + digest)

        var parsedUrl = parseUrl(request.url)

        var concat = format('%s|%s|%s',
            request.req.method,
            request.url,
            Object.keys(request.req._headers).filter(function(key) {
                return !!key.match(/^x-mcash-/)
            }).sort().reduce(function(p, key) {
                return format('%s%s%s=%s',
                    p,
                    p.length ? '&' : '',
                    key.toUpperCase(),
                    request.req._headers[key])
            }, ''))

        var sign = crypto.createSign('RSA-SHA256')
        .update(concat)
        .sign(this.opts.privateKey, 'base64')

        debug('will sign with private key:\n%s', concat)

        request = request
        .set('Authorization', 'RSA-SHA256 ' + sign)
    }

    if (opts.payload) {
        request = request.send(opts.payload)
    }

    return request
}

exports.handler = require('./handler')
