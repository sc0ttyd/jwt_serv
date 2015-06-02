'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

var https = require('https');
var pem = require('pem');
var koa = require('koa');
var jwt = require('koa-jwt');
var session = require('koa-session');

var seneca = require('seneca')();
seneca.use('seneca-bluebird');

var authHandler = require('./seneca-auth-handler')(seneca);
var userHandler = require('./seneca-user')(seneca);

var app = koa();
app.keys = ['SeeCr3Ts'];
app.use(session(app));

// Middleware below this line is only reached if JWT token is valid
// unless the URL is root or starts with '/public, /auth, or /connect'
app.use(jwt({ secret: process.env.JWT_KEY }).unless({ path: [/^\/($|public|auth|connect)/] }));

app.use(require('koa-static')('public'));

// delegate authentication to seneca auth client
app.use(require('./seneca-auth-koa-client')(seneca));

app.use(userHandler.routes());


pem.createCertificate(
    { days:1, selfSigned:true },
    function(err, keys) {
        https.createServer({key: keys.serviceKey, cert: keys.certificate}, app.callback()).listen(3018);
        console.log('HTTPS listening on port 3018');
    }
);
