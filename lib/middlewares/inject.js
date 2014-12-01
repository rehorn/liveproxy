var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var path = require('path');
var jsconsole = require('../vendors/jsconsole/server/jsconsole');

var fs = require('fs');
var path = require('path');
var url = require('url');

var config = require('../config');
var util = require('../util');
var watch = require('../watch');

function getLocalPath(uri, handler) {
    var opt = config.get();
    var reqUrl = url.parse(uri);
    var pathname = reqUrl.pathname;
    var handlerPathname = util.parseUrl(handler.match).pathname;
    var filepath = path.join(process.cwd(), opt.cwd, handler.action, pathname.replace(handlerPathname, ''));
    return filepath;
};

function isLocalFound(uri, handler) {
    var filepath = getLocalPath(uri, handler);
    if (fs.existsSync(filepath)) {
        return true;
    } else {
        return false;
    }
};

function getHandler(uri) {
    var opt = config.get();
    return _.find(opt.handler, function(handler) {
        if (util.testUrl(uri, handler) && isLocalFound(uri, handler)) {
            return true;
        }
        return false;
    });
};

module.exports = function(app, server, options) {
    var noop = function() {};
    var filetype, io, sockets;
    var opt = {
        filetype: 'js|css|html|xhtml',
        reload: true,
        jsconsole: true,
        consoleId: 'liveproxy',
        debug: 8091,
        port: 8090,
        inject: [],
        watch: '.'
    };
    _.extend(opt, options);
    filetype = opt.filetype.split('|');

    if (opt.reload) {
        app.use('/livereload', express['static'](path.join(__dirname, '../vendors/livereload/')));
        sockets = [];
        opt.inject.push('<script src="http://localhost:8090/socket.io/socket.io.js"></script>');
        opt.inject.push('<script src="/livereload/livereload.js"></script>');

        io = (require('socket.io')).listen(server);

        watch.watchReload(opt.watch, filetype, function(data) {
            console.log('emit livereload...');
            _.each(sockets, function(socket) {
                socket.emit('update', data);
            });
        });

        io.sockets.on('connection', function(socket) {
            sockets.push(socket);
            return socket.on('disconnect', function() {
                var index;
                index = sockets.indexOf(socket);
                if (index !== -1) {
                    return sockets.splice(index, 1);
                }
            });
        });
    }

    if (opt.jsconsole) {
        // singleton jsconsole server
        util.checkPortUsed(opt.debug, function(isUsed) {
            if (!isUsed) {
                var serv = new express();
                serv.use(bodyParser.urlencoded({
                    extended: true
                }));
                serv.use(bodyParser.json());
                serv.use('/', express['static'](path.join(__dirname, '../vendors/jsconsole/client/')));
                jsconsole(serv);
                serv.listen(opt.debug);
            }
        });
        opt.inject.push('<script src="http://localhost:' + opt.debug + '/remote.js?' + opt.consoleId + '"></script>');
    }

    return function(req, res, next) {
        var handler = getHandler(req.url);
        if (handler && opt.inject.length > 0) {
            var end, write;
            write = res.write;
            end = res.end;
            res.flush = noop;
            res.chunks = '';
            res.write = function(chunk, encoding) {
                var e, header, length;
                header = res.get('content-type');
                length = res.get('content-length');
                if ((/^text\/html/.test(header)) || !header) {
                    if (Buffer.isBuffer(chunk)) {
                        chunk = chunk.toString('utf8');
                    }
                    if (!~chunk.indexOf('</head>')) {
                        return write.call(res, chunk, 'utf8');
                    }
                    chunk = chunk.replace('</head>', opt.inject.join('') + '</head>');
                    if (length) {
                        length = parseInt(length);
                        length += Buffer.byteLength(opt.inject.join(''));
                        try {
                            res._header = null;
                            res.set('content-Length', length);
                            this._implicitHeader();
                        } catch (_error) {
                            e = _error;
                        }
                    }
                    return write.call(res, chunk, 'utf8');
                } else {
                    return write.call(res, chunk, encoding);
                }
            };

            res.end = function(chunk, encoding) {
                if (chunk != null) {
                    this.write(chunk, encoding);
                }
                return end.call(res);
            };

            return next();
        } else {
            next();
        }
    };
};
