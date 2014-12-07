var express = require('../index').express;
var router1 = express.Router();

// route mapping
var routeMap = {
    // '/': './modules/demo/index.js'
};

// add get router by routeMap
for (var key in routeMap) {
    if (routeMap.hasOwnProperty(key)) {
        router.get(key, require(routeMap[key]));
    }
}

router1.get('/v1/post/:id', function(req, res, next) {
    log(req);
    res.end('v1 called');
});

module.exports = {
    cwd: './test',
    reload: true,
    jsconsole: true,
    consoleId: 'liveproxy',
    handler: [{
        match: 'find.qq.com/index.html',
        action: './dist/'
    }, {
        match: 's.url.cn/qqfind/cdn/',
        action: './dist/'
    }],
    mocker: [{
        match: 'cgi.find.qq.com',
        action: router1
    }],
    router: [{
        match: 'find.qq.com/cgi-bin/',
        action: '-'
    }, {
        match: 'find.qq.com/',
        action: '10.12.23.156:8080'
    }],
    extender: [{
        match: 'find.qq.com/cgi-bin/',
        action: {
            func: 'delay',
            args: 5
        }
    }, {
        match: 'find.qq.com/',
        action: {
            func: 'addResponseHeader',
            args: ['powered', 'alloyteam']
        }
    }]
};
