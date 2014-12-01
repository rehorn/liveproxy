var express = require('express');
var _ = require('underscore');
var path = require('path');
var vhost = require('vhost');
var http = require('http');
var net = require('net');
var colors = require('colors');

var handler = require('./middlewares/handler');
var router = require('./middlewares/router');
var extender = require('./middlewares/extender');
var inject = require('./middlewares/inject');
var config = require('./config');
var watch = require('./watch');

var opt;
var liveproxy = function(options) {
    options = options || {};
    opt = config.parse(options);

    var app = new express();
    var server = http.createServer(app);

    var opt = config.get();
    // inject
    app.use(inject(app, server, {
        reload: opt.reload,
        jsconsole: opt.jsconsole,
        consoleId: opt.consoleId,
        debug: opt.debug,
        port: opt.port,
        watch: path.join(process.cwd(), opt.cwd)
    }));

    // extender
    app.use(extender());

    // local replacement
    app.use(handler(app, server));

    // cgi mocker
    opt.mocker.forEach(function(mock) {
        var hostApp = new express();
        hostApp.use(mock.action);
        app.use(vhost(mock.match, hostApp));
    });

    // host router
    app.use(router());

    // directly forward https request
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
            console.log('[https connect error]: ' + req.url.grey);
        });
    });

    // directly forward websocket 
    server.on('upgrade', function(req, socket, head) {
        socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
            'Upgrade: WebSocket\r\n' +
            'Connection: Upgrade\r\n' +
            '\r\n');

        socket.pipe(socket); // echo back
    });

    server.listen(8090, function() {
        console.log('liveproxy'.green + ' is running at port: ' + '8090'.red);
    });

    // watch config file change
    watch.watchConfig();
};

liveproxy.express = express;
module.exports = liveproxy;
