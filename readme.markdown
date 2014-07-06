mCASH library for node.js
===

[![Build Status](https://travis-ci.org/abrkn/mcash.png)](https://travis-ci.org/abrkn/mcash)

The library is divided into two parts:

- **Handler**: Express/connect compatible middleware that verifiest signatures of incoming callbacks.
- **Client**: Simplifies calling mCASH API by handling signing

installation
---

`npm install mcash`

usage
---

### client

The client is a wrapper of superagent that handles mCASH security for you:

```
var Mcash = require('mcash')
var mcash = new Mcash({
    testbedToken: 'mytestbedtoken',
    environment: 'test',
    user: 'bobby',
    secret: 'supersecret',
    merchantId: 'abcdefg',
    privateKey: '-----BEGIN RSA PRIVATE KEY-----\nremember to escape newlines'
})

mcash.request('POST', 'shortlink/')
.send({
    description: 'test'
})
.end(function(err, res) {
    console.log(res.body.id)
})
```

It can also be used from the command line (see `bin/mcash`):

`mcash shortlink create test`

Usage from the command line requires quite a few options. See config.json.example for an example.

### handler

The handler is an express.js compatible middleware that verifies the authenticity of incoming web hooks from mCASH:

```
var handler = require('mcash').handler
app.use('/mcash-callback', handler('test'))
app.post('/mcash-callback', function(req, res, next) {
    console.log('mCASH says:\n%s', req.body)
})
```

author
---

Andreas Brekken <a@abrkn.com>

license
---

MIT
