var fs = require('fs');
var path = require('path');
var url = require('url');
var mime = require('mime');
var _ = require('underscore');

var config = require('../config');
var util = require('../util');

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

function localFileResponder(handler, req, res, options) {
    options = options || {};
    var filepath = getLocalPath(req.url, handler);
    console.log('[handler]: '.yellow + req.url.grey);
    console.log('   -> ' + filepath);
    fs.existsSync(filepath) && fs.stat(filepath, function(err, stat) {
        if (err) {
            throw err;
        }

        if (!stat.isFile()) {
            throw new Error('The responder is not a file!');
        }

        res.statusCode = options.statusCode || 200;
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', mime.lookup(filepath));
        res.setHeader('Server', 'liveproxy');

        fs.createReadStream(filepath).pipe(res);
    });
};

module.exports = function(app, server, options) {
    return function(req, res, next) {
        var handler = getHandler(req.url);
        if (handler) {
            localFileResponder(handler, req, res);
        } else {
            next();
        }
    };
};
