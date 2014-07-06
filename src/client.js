var superagent = require('superagent')
var crypto = require('crypto')
var debug = require('debug')('mcash')
var format = require('util').format
var CONTENT_TYPE = 'application/vnd.mcash.api.merchant.v1+json'

superagent.parse[CONTENT_TYPE] = superagent.parse['application/json']

var Mcash = module.exports = exports = function(opts) {
    this.opts = opts
}

exports.ENDPOINTS = {
    production: 'https://api.mca.sh/merchant/v1/',
    test: 'https://mcashtestbed.appspot.com/merchant/v1/'
}

Mcash.prototype.request = function(type, url) {
    var fn = superagent[type.toLowerCase()]

    var request = fn(exports.ENDPOINTS[this.opts.environment] + url)
    .buffer(true)
    .parse(superagent.parse.json)
    .set('Accept', 'application/vnd.mcash.api.merchant.v1+json')
    .set('Authorization', 'SECRET ' + this.opts.secret)
    .set('X-Mcash-Merchant', this.opts.merchantId)
    .set('X-Mcash-User', this.opts.user)

    if (this.opts.environment == 'test') {
        request = request.set('X-Testbed-Token', this.opts.testbedToken)
    }

    return request
}

exports.handler = require('./handler')
