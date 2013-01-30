var exec = require('child_process').exec,
    util = require('./index'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    path = require('path'),
    Stack = require('./stack').Stack,
    cover = require('../lib/coverage'),
    mkdirp = require('mkdirp'),
    log = require('./log'),
    wrapper = path.join(__dirname, './wrapper/wrapper.js');

exports.init = function(options, callback) {
    options = options || {};
    options.paths = options.paths || [];
    exports.check(options, function(version) {
        if (!version) {
            log.error('Please install the phantomjs binary in your path!');
            util.exit(1);
        }

        if (!options.silent && !options.quiet) {
            util.log('Starting Grover on ' + options.paths.length  + ' files with PhantomJS@' + version);
            util.log('  Running ' + options.concurrent + ' concurrent tests at a time.');

            if (options.timeout) {
                util.log('  Using a ' + options.timeout + ' second timeout per test.');
            }
        }
        if (options.server) {
            require('../lib/server').start(options);
        }
        if (options.exitOnFail) {
            util.log('--will exit on first test error');
        }

        callback(version);
    });
};

exports.check = function(options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    if (!('phantom-bin' in options)) {
        options['phantom-bin'] = 'phantomjs';
    }
    exec(options['phantom-bin'] + ' --version', function(stdin, stdout) {
        var version = stdout.replace('\n', '');
        callback(version);
    });
};

var parseResponse = function(options, file, stdout) {
    var err = null,
        results;
    try {
        results = JSON.parse(stdout);
        if (util.canPrint(options, results)) {
            util.status(results);
        }
        if (options.exitOnFail && results.failed) {
            util.exit(1);
        }
    } catch (e) {
        if (options.debug) {
            util.error('Failed to parse response for ' + file + ', readding to queue');
        }
        err = file;
    }
    return [err, results];
};

exports.parseResponse = parseResponse;

exports.test = function(options, file, callback) {
    var args = [
        wrapper,
        file
    ],
    stdout = '', child;

    if (!util.existsSync(file) && !file.match(/^https?:\/\//) && !options.server) {
        if (util.canPrint(options)) {
            util.error(':( Can not find file: ' + file);
        }
        util.exit(1);
    }
    
    args.push(options.timeout);
    args.push(options.console);
    
    if (!('phantom-bin' in options)) {
        options['phantom-bin'] = 'phantomjs';
    }
    child = spawn(options['phantom-bin'], args);
    child.stdout.on('data', function(data) {
        stdout += data;
    });
    child.on('exit', function() {
        var res = parseResponse(options, file, stdout);
        callback(res[0], res[1]);
    });
};

exports.dispatch = function(options, callback) {
    var stack = new Stack(),
        testResults = [],
        i,
        noop = function() {},
        run = function(cb) {
            var file = options.paths.shift();
            if (file) {
                exports.test(options, file, function(err, json) {
                    if (err) {
                        options.paths.unshift(file);
                    } else {
                        testResults.push(json);
                    }
                    run(stack.add(noop));
                    cb();
                });
            } else {
                cb();
            }
        };
    

    for (i = 1; i < options.concurrent; i++) {
        run(stack.add(noop));
    }
    stack.done(function() {
        callback(null, testResults);
    });
};

exports.process = function(args, callback) {
    if (typeof args === 'function') {
        callback = args;
        args = null;
    }
    args = args || process.argv.slice(2);
    var options = require('./options').parse(args),
        done = false;

    util.init(options);

    exports.init(options, function() {
        cover.init();
        var runTests = function () {
            if (done) {
                return; //Don't execute more tests
            }
            options.START = (new Date()).getTime();
            exports.dispatch(options, function(err, results) {
                done = true;
                exports.done(options, results, callback);
            });
        };
        
        if (options.run){
            runTests();
        } else {
            util.log('not running tests, just serving them.');
            process.on('SIGCONT', function() {
                util.log('Received parent message, continuing test execution');
                runTests();
            });
            process.on('message', function (msg) {
                if (msg['continue']) {
                    util.log('Received parent message, continuing test execution');
                    //Reset start timer because we were paused
                    runTests();
                }
            });
        }
        
    });
};

exports.done = function(options, testResults, callback) {
    options = options || {};
    testResults = testResults || [];
    var res = {
        name: 'Total',
        passed: 0,
        failed: 0,
        ignored: 0,
        total: 0,
        duration: 0
    }, proc, output, END;

    if (options.server) {
        options.httpd.close();
    }
    if (options.outfile && options.outtype) {
        proc = require(path.join(__dirname, '../lib/process'));
        output = proc(testResults, options.outtype);
        
        if (util.canPrint(options)) {
            util.log('Writing files in ' + options.outtype + ' format to: ' + options.outfile);
        }
        mkdirp.sync(path.dirname(options.outfile));
        fs.writeFileSync(options.outfile, output, 'utf8');
    }

    cover.options(options);

    testResults.forEach(function(json) {
        res.passed += json.passed;
        res.failed += json.failed;
        res.total += json.total;
        res.ignored += json.ignored;
        res.duration += json.duration;
        if (json.coverage) {
            cover.set(json.coverage);
        }
    });

    END = (new Date()).getTime();
    if (!options.silent && !options.quiet && !options.coverage) {
        log.log('----------------------------------------------------------------');
        util.status(res, options.START, END);
    }
    if (res.failed) {
        util.exit(1);
    }
    if (options.coverage) {
        cover.report(options);
        log.log('----------------------------------------------------------------');
        util.status(res, options.START, END);
        cover.save(options);
    }
    if (process.send) {
        process.send({ done: true });
        util.exit(0);
    }

    if (callback) {
        callback(null, testResults);
    }

};
