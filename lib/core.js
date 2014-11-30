var express = require('express');
var _ = require('underscore');
var path = require('path');
var vhost = require('vhost');

var handler = require('./middlewares/handler');
var router = require('./middlewares/router');
var extender = require('./middlewares/extender');
var config = require('./config');

var opt;
var liveproxy = function(options) {
    options = options || {};
    opt = config.parse(options);

    var app = new express();

    // extender
    app.use(extender());

    // local replacement
    app.use(handler());

    // cgi mocker
    opt.mocker.forEach(function(mock) {
        var hostApp = new express();
        hostApp.use(mock.action);
        app.use(vhost(mock.match, hostApp));
    });

    // host router
    app.use(router());

    app.listen(8090);

    console.log('liveproxy is running at port: 8090');

};

module.exports = liveproxy;
