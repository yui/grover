var util = require('./index'),
    path = require('path'),
    url = require('url'),
    fs = require('fs'),
    express = require('express'),
    echoecho = require('echoecho'),
    combo = require('combohandler'),
    log = require('./log'),
    server;

var showError = function(options, e) {
    var str = 'Grover Error\n';
    if (e.code === 'EADDRINUSE') {
        str += 'Port ' + options.port + ' is in use, try a different one!\n';
    } else if (e.code === 'EACCES') {
        str += 'You do not have access to port ' + options.port + '!\n';
    } else {
        str += e;
    }
    return str;
};

exports.showError = showError;

exports.start = function(options, callback) {
    var pre = '/',
        root = options.server,
        handler = function (req, res) {
            var u = url.parse(req.url),
                p = path.join(root, u.pathname);

            util.exists(p, function(x) {
                if (!x) {
                    if (echoecho.handle(req)) {
                        echoecho.serve(req, res);
                    } else {
                        res.statusCode = 404;
                        res.end('Not Found', 'utf8');
                    }
                } else {
                    fs.readFile(p, 'utf8', function(err, data) {
                        if (err) {
                            res.statusCode = 404;
                            res.end('Not Found', 'utf8');
                        } else {
                            res.statusCode = 200;
                            res.end(data, 'utf8');
                        }
                    });
                }
            });
        };

    if (!options.silent && !options.quiet) {
        util.log('  starting grover server');
        util.log('  assuming server root as ' + process.cwd());
    }
    if (options.prefix) {
        pre = options.prefix;
    }
    options.prefix = 'http:/'+'/127.0.0.1:' + options.port;

    if (!options.run) {
        util.log('listening on: ' + options.prefix);
    }

    options.paths.forEach(function(url, key) {
        url = url.replace(root, ''); //If they are full filesytem paths, we replace the root
        var URI = options.prefix + path.join(pre, url);
        URI = URI.split(path.sep).join('/');
        options.paths[key] = URI;
    });

    echoecho.paths(options.paths);

    server = express.createServer();

    server.use(express.bodyParser());

    if (options.combo && options.combo.length) {
        options.combo.forEach(function(info) {
            util.log('  attaching combo to: ' + info.route);
            server.get(info.route, combo.combine({ rootPath: info.root }), function (req, res) {
                res.send(res.body, 200);
            });
        });
    }

    server.get('/'+'*', handler);
    server.post('/'+'*', handler);
    server['delete']('/'+'*', handler);
    server.put('/'+'*', handler);

    options.httpd = server;


    server.on('error', function(e) {
        if (callback) {
            callback(e, server);
        }
        log.error(util.color(showError(options, e), 'red'));
        try {
        server.close();
        } catch (e) {}
        util.exit(1);
    });

    server.on('listening', function() {
        if (callback) {
            callback(null, server);
        }
        if (process.send) { //We are a child process
            process.send({ serving: true, server: server });
        }
    });
    server.listen(options.port);
};
