var _ = require('underscore');
var path = require('path');

var config = {};
var opt = {
    cwd: './',
    config: './config.js',
    proxyAgent: '',
    handler: [],
    mocker: [],
    router: [],
    extender: []
};

config.parse = function(options) {
    var configFile = {};
    if (options.config) {
        configFile = require(path.join(process.cwd(), options.config));
    }
    opt = _.extend(opt, options, configFile);
    return opt;
};

config.get = function() {
    return opt;
};

module.exports = config;
