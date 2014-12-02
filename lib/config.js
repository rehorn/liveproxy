var _ = require('underscore');
var path = require('path');

var config = {};
var opt = {
    cwd: './',
    config: './config.js',
    port: 8090,
    debug: 8091,
    proxyAgent: '',
    reload: true,
    jsconsole: true,
    consoleId: 'liveproxy',
    openBrowser: false,
    handler: [],
    mocker: [],
    router: [],
    extender: []
};

config.getConfigPath = function() {
    return path.join(process.cwd(), opt.config);
};

config.parse = function(options) {
    options = options || {};
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
