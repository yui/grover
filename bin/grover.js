#!/usr/bin/env node

var path = require('path'),
    fs = require('fs'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    wrapper = path.join(__dirname, '../lib/wrapper/wrapper.js'),
    options = require(path.join(__dirname, '../lib/options')).parse(process.argv.slice(2)),
    existsSync = fs.existsSync || path.existsSync,
    START = (new Date()).getTime(),
    util = require(path.join(__dirname, '../lib/')),
    check = function(cb) {
        exec('phantomjs --version', function(stdin, stdout, stderr) {
            var version = stdout.replace('\n', '');
            cb(version);
        });
    },
    testResults = [],
    counter = options.paths.length,
    done = function() {
        var res = {
            name: 'Total',
            passed: 0,
            failed: 0,
            ignored: 0,
            total: 0
        }, proc, output, END;

        if (options.server) {
            require('../lib/server').stop();
        }
        if (options.outfile && options.outtype) {
            proc = require(path.join(__dirname, '../lib/process'));
            output = proc(testResults, options.outtype);
            
            if (!options.silent && !options.quiet) {
                util.log('Writing files in ' + options.outtype + ' format to: ' + options.outfile);
            }
            fs.writeFileSync(options.outfile, output, 'utf8');
        }

        testResults.forEach(function(json) {
            var i;
            res.passed += json.passed;
            res.failed += json.failed;
            res.total += json.total;
            res.ignored += json.ignored;
            if (json.jscoverage) {
                res.jscoverage = res.jscoverage || {};
                for (i in json.jscoverage) {
                    res.jscoverage[i] = res.jscoverage[i] || {};
                    res.jscoverage[i].hit = res.jscoverage[i].hit || 0;
                    if (json.jscoverage[i].hit > res.jscoverage[i].hit) {
                        res.jscoverage[i].hit = json.jscoverage[i].hit;
                    }
                    res.jscoverage[i].lines = json.jscoverage[i].lines;
                    res.jscoverage[i].miss = (res.jscoverage[i].lines - res.jscoverage[i].hit);
                }
            }
            if (json.yuiTestCoverage) {
                res.jscoverage = res.jscoverage || {};
                for (i in json.yuiTestCoverage) {
                    res.jscoverage[i] = res.jscoverage[i] || {};
                    res.jscoverage[i].hit = res.jscoverage[i].hit || 0;
                    res.jscoverage[i].lines = res.jscoverage[i].lines || 0;
                    res.jscoverage[i].miss = res.jscoverage[i].miss || 0;

                    res.jscoverage[i].hit += json.yuiTestCoverage[i].calledLines;
                    res.jscoverage[i].lines += json.yuiTestCoverage[i].coveredLines;
                    res.jscoverage[i].miss += (json.yuiTestCoverage[i].coveredLines - json.yuiTestCoverage[i].calledLines);
                }
            }
        });

        END = (new Date()).getTime();
        if (!options.silent && !options.quiet) {
            console.log('----------------------------------------------------------------');
            util.status(res, START, END);
        }
        if (res.failed) {
            process.exit(1);
        }
    },
    run = function() {
        var file = options.paths.shift(),
            args = [
                wrapper,
                file
            ],
            stdout = '', child;

        if (file) {
            if (!existsSync(file) && !file.match(/^https?:\/\//) && !options.server) {
                if (util.canPrint(options)) {
                    util.error(':( Can not find file: ' + file);
                }
                process.exit(1);
            }
            
            if (options.timeout) {
                args.push(options.timeout);
            }
            child = spawn('phantomjs', args);
            child.stdout.on('data', function(data) {
                stdout += data;
            });
            child.on('exit', function(code) {
                try {
                    var results = JSON.parse(stdout);
                    testResults.push(results);
                    if (util.canPrint(options, results)) {
                        util.status(results);
                    }
                    if (options.exitOnFail && results.failed) {
                        process.exit(1);
                    }
                } catch (e) {
                    util.error('Failed to parse response for ' + args[1] + ', readding to queue');
                    options.paths.push(args[1]);
                }
                run();
            });
        } else {
            if (counter === testResults.length) {
                done();
            }
        }
    };


if (!options.paths.length) {
    console.error('No files given');
    process.exit(1);
}

check(function(version) {
    var i = 0;
    if (!version) {
        console.error('Please install the phantomjs binary in your path!');
        process.exit(1);
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
    if (options.concurrent) {
        for (i = 1; i < options.concurrent; i++) {
            run();
        }
    } else {
        run();
    }
});

