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
    Table = require('cli-table'),
    check = function(cb) {
        exec('phantomjs --version', function(stdin, stdout, stderr) {
            var version = stdout.replace('\n', '');
            cb(version);
        });
    },
    testResults = [],
    counter = options.paths.length,
    istanbul = require('istanbul'),
    done = function() {
        var res = {
            name: 'Total',
            passed: 0,
            failed: 0,
            ignored: 0,
            total: 0
        }, proc, output, END,
        coverage = [], covered = {}, table;

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
            if (json.coverage) {
                res.coverage = res.coverage || {};
                for (i in json.coverage) {
                    res.coverage[i] = res.coverage[i] || {};
                    res.coverage[i].path = i;
                    res.coverage[i].calledLines = res.coverage[i].calledLines || 0;
                    res.coverage[i].coveredLines = res.coverage[i].coveredLines || 0;

                    res.coverage[i].calledLines += json.coverage[i].calledLines;
                    res.coverage[i].coveredLines += json.coverage[i].coveredLines;
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
        if (options.coverage) {
            util.log('Generating Coverage Report');
            testResults.forEach(function(result) {
                if (result.coverage) {
                    Object.keys(result.coverage).forEach(function(file) {
                        if (covered[file]) {
                            var index = 0, info;
                            coverage.forEach(function(info, i) {
                                if (info.path === file) {
                                    index = i;
                                }
                            });
                            if (index && coverage[index]) {
                                info = result.coverage[file];
                                ['coveredLines', 'calledLines', 'coveredFunctions', 'calledFunctions'].forEach(function(key) {
                                    coverage[index][key] = (info[key] > coverage[index][key]) ? info[key] : coverage[index][key];
                                });
                            }
                        } else {
                            covered[file] = true;
                            result.coverage[file].path = file;
                            coverage.push(result.coverage[file]);
                        }
                    });
                }
            });
            table = new Table({
                head: ['path', 'lines', '%', 'functions', '%' ],
                colAligns: [ 'left', 'center', 'right', 'center', 'right'  ],
                style: {
                    'padding-left': 2,
                    'padding-right': 2,
                    head: ['blue']
                }
            });
            coverage.forEach(function(row) {
                if (row.lines) {
                    var err,
                        percentLine = Math.floor((row.calledLines / row.coveredLines) * 100),
                        percentFunction = Math.floor((row.calledFunctions / row.coveredFunctions) * 100),
                        cell = [
                            row.path,
                            row.calledLines + '/' + row.coveredLines,
                            percentLine + '%',
                            row.calledFunctions + '/' + row.coveredFunctions,
                            percentFunction + '%',
                        ];

                    if (percentLine <= options.coverageWarn) {
                        err = true;
                        cell[1] = String(cell[1]).red;
                        cell[2] = String(cell[2]).red;
                    }
                    if (percentFunction <= options.coverageWarn) {
                        err = true;
                        cell[3] = String(cell[3]).red;
                        cell[4] = String(cell[4]).red;
                    }
                    if (err) {
                        cell[0] = util.bad.red + ' ' + cell[0];
                    } else {
                        cell[0] = util.good.green + ' ' + cell[0];
                    }
                    table.push(cell);
                }
            });
            console.log(table.toString());
        }
        if (process.send) {
            process.send({ done: true });
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
                        if (results.coverageType && results.coverageType == 'istanbul') {
                            results.coverage = istanbul.utils.toYUICoverage(results.coverage);
                        }
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
    var i = 0,
        runTests = function () {
            if (options.concurrent) {
                for (i = 1; i < options.concurrent; i++) {
                    run();
                }
            } else {
                run();
            }
        };
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
    if (options.run){
        runTests();
    } else {
        util.log('not running tests, just serving them.');
        process.on('SIGCONT', function() {
            util.log('Received SIGCONT, continuing test execution');
            runTests();
        });
        process.on('message', function (msg) {
            if (msg.continue) {
                util.log('Received parent message, continuing test execution');
                runTests();
            }
        });
    }
});

