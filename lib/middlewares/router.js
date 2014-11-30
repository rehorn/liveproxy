var url = require('url');

var _ = require('underscore');
var httpProxy = require('http-proxy');
var httpProxyAgent = require('http-proxy-agent');

var config = require('../config');
var util = require('../util');

function getRouter(uri) {
    var opt = config.get();
    return _.find(opt.router, function(route) {
        if (util.testUrl(uri, route)) {
            return true;
        }
        return false;
    });
};

function goProxy(req, res, router, options) {
    var opt = config.get();
    var host, port, hostIp;
    if (router) {
        host = router.split(':')[0];
        port = router.split(':')[1] || '80';
    }
    var urlObj = url.parse(req.url);
    urlObj.host = host || urlObj.hostname;
    urlObj.port = port || urlObj.port;

    // console.log('req proxied, host:' + host + ', port:' + port + ', url:' + req.url);
    var proxy = httpProxy.createProxyServer({});
    var proxyOptions = {
        target: {
            host: urlObj.host,
            port: urlObj.port
        }
    };
    // TODO: router with a proxy agent has errors
    // router ip should be visit without proxy agent
    if (!router && opt.proxyAgent) {
        proxyOptions.agent = httpProxyAgent(opt.proxyAgent);
    }
    proxy.web(req, res, proxyOptions, function(e) {
        // proxy error -> retry once
        proxy.web(req, res, proxyOptions, function(e) {
            console.log('[proxy error]: ' + req.url.grey);
            // console.log(e.stack);
            res.send('503');
        });
    });
};

function routeResponder(router, req, res, options) {
    options = options || {};
    var proxyHost = '';
    if (router) {
        // directly proxy
        if (router.action == '-') {
            console.log('[proxy]: ' + req.url);
            goProxy(req, res, null, options);
        } else {
            // proxy to specified server
            console.log('[route]: ' + req.url);
            console.log('   -> ' + router.action);
            goProxy(req, res, router.action, options);
        }
    } else {
        // directly proxy
        console.log('[proxy]: ' + req.url);
        goProxy(req, res, null, options);
    }
};

module.exports = function(options) {
    return function(req, res, next) {
        var route = getRouter(req.url);
        if (route) {
            routeResponder(route, req, res);
        } else {
            next();
        }
    };
};
