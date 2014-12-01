// from puer
function addListener(el, type, cb) {
    if (el.addEventListener) {
        return el.addEventListener(type, cb, false)
    } else if (el.attachEvent) {
        return el.attachEvent("on" + type, cb);
    }
};

var livereload = function() {
    var location = window.location,
        // origin = location.protocol + "//" + location.host;
        origin = 'http://localhost:8090'; // !!: 将 localhost 跳过代理设置

    var socket = io.connect(origin);

    var stylesheets = document.getElementsByTagName("link");

    var cacheBuster = function(url) {
        var date = Math.round(+new Date / 1000).toString();
        url = url.replace(/(\&|\?)cacheBuster=\d*/, '');
        return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'cacheBuster=' + date;
    };
    var updateStyle = function(stylePathName) {
        for (var i = stylesheets.length; i--;) {
            var href = stylesheets[i].getAttribute("href");
            stylesheets[i].setAttribute("href", cacheBuster(stylesheets[i].getAttribute("href")));
        }
        return true;
    }

    socket.on('update', function(data) {
        if (data.css && updateStyle(data.css)) return true;
        window.location.reload();
    })
}

addListener(window, 'load', livereload);
