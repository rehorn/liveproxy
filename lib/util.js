var url = require('url');
var net = require('net');
var exec = require('child_process').exec;

var util = {};

util.parseUrl = function(uri) {
    var pathname = '/',
        hostname = '';
    // 处理match，获取pathname
    var urlpath = uri.match(/http[s]?/) ? uri : 'http://' + uri;
    var urlInfo = url.parse(urlpath.replace(/\*/g, '__ls__'));
    hostname = urlInfo.hostname.replace(/__ls__/g, '\*');
    pathname = urlInfo.pathname.replace(/__ls__/g, '\*');
    pathname = pathname.indexOf('*') > -1 ? pathname.substring(0, pathname.indexOf('*')) : pathname;
    pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);

    return {
        hostname: hostname,
        pathname: pathname
    };
};

util.testUrl = function(uri, handler) {
    var reqUrl = url.parse(uri);
    var pathUrl = reqUrl.hostname + reqUrl.pathname;
    var matchResolve = handler.match.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\//g, '\\/');
    if (uri == handler.match || pathUrl.indexOf(handler.match) >= 0 || new RegExp(matchResolve).test(uri)) {
        return true;
    } else {
        return false;
    }
};

// clear require cache of folder path
util.clearCache = function(path) {
    for (key in require.cache) {
        if (key.indexOf(path) >= 0) {
            delete require.cache[key];
            console.log('clearcache: '.red + key);
        }
    }
};

util.checkPortUsed = function(port, cb) {
    var inUse = true;
    client = new net.Socket();
    client.once('connect', function() {
        cb(inUse);
    });
    client.once('error', function(err) {
        if (err.code !== 'ECONNREFUSED') {
            cb(inUse);
        } else {
            inUse = false;
            cb(inUse);
        }
    });
    client.connect({
        port: port,
        host: '127.0.0.1'
    });
};

util.openBrowser = function(target, callback) {
    var map, opener;
    map = {
        'darwin': 'open',
        'win32': 'start '
    };
    opener = map[process.platform] || 'xdg-open';
    return exec('' + opener + ' ' + target, callback);
};

module.exports = util;
