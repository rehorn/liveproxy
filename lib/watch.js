var chokidar = require('chokidar');
var config = require('./config');
var util = require('./util');

var watch = {};
watch.watchConfig = function() {
    var org = config.get().config;
    var configPath = config.getConfigPath();
    if (configPath) {
        var watcher = chokidar.watch(configPath, {
            persistent: true
        });
        watcher.on('change', function(path) {
            console.log('config file changed...');
            util.clearCache(path);
            config.parse({
                config: org
            });
        });
    }
};

watch.watchReload = function(dir, filetype, cb) {
    var watcher = chokidar.watch(dir, {
        ignored: function(filename) {
            var ext, matched;
            matched = /\.(\w+)$/.exec(filename);
            if (matched) {
                ext = matched[1];
                return filetype.indexOf(ext) === -1;
            } else {
                return false;
            }
        },
        persistent: true
    });

    watcher.on('change', function(path, stats) {
        var data;
        data = {
            'path': path
        };
        if (path.indexOf('.css') >= 0) {
            data.css = path.slice(process.cwd().length);
        }
        cb(data);
    });

};

module.exports = watch;
