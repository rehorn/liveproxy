var express = require('express');
var _ = require('underscore');
var path = require('path');
var vhost = require('vhost');
var http = require('http');
var net = require('net');

var handler = require('./middlewares/handler');
var router = require('./middlewares/router');
var extender = require('./middlewares/extender');
var config = require('./config');

var opt;
var liveproxy = function(options) {
    options = options || {};
    opt = config.parse(options);

    var app = new express();
    var server = http.createServer(app);

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

    server.listen(8090, function() {
        console.log('liveproxy is running at port: 8090');
    });

    // directly forward https request
    // TODO support https responders
    server.on('connect', function(req, cltSocket, head) {
        // connect to an origin server
        var srvUrl = require('url').parse('http://' + req.url);
        var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, function() {
            cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                'Proxy-agent: LivePool-Proxy\r\n' +
                '\r\n');
            srvSocket.write(head);
            srvSocket.pipe(cltSocket);
            cltSocket.pipe(srvSocket);
        });
        srvSocket.on('error', function() {
            logger.log('[https connect error]: ' + req.url.grey);
        });
    });

    // directly forward websocket 
    // TODO support websocket responders
    server.on('upgrade', function(req, socket, head) {
        socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
            'Upgrade: WebSocket\r\n' +
            'Connection: Upgrade\r\n' +
            '\r\n');

        socket.pipe(socket); // echo back
    });
};

module.exports = liveproxy;
