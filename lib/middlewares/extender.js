var _ = require('underscore');

var config = require('../config');
var util = require('../util');

function getExtender(uri) {
    var opt = config.get();
    return _.find(opt.extender, function(ext) {
        if (util.testUrl(uri, ext)) {
            return true;
        }
        return false;
    });
};

function runExtender(ext, req, res, next) {
    var func = ext.action.func;
    var args = ext.action.args;
    var isLog = false;

    if (func == 'delay') {
        isLog = true;
        setTimeout(function() {
            next();
        }, args);
    } else if (func == 'addResponseHeader') {
        res.set(args[0], args[1]);
        next();
    } else {
        next();
    }
    if (isLog) {
        console.log('[ext]: '.yellow + req.url.gray);
        console.log('   -> func:' + func + ', args:' + args);
    }
};

module.exports = function(options) {
    return function(req, res, next) {
        var ext = getExtender(req.url);
        if (ext) {
            runExtender(ext, req, res, next);
        } else {
            next();
        }
    };
};
