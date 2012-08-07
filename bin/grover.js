#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var wrapper = path.join(__dirname, '../lib/wrapper.js');
var options = require(path.join(__dirname, '../lib/options')).parse(process.argv.slice(2));

var existsSync = fs.existsSync || path.existsSync;

var START = (new Date()).getTime();
var util = require(path.join(__dirname, '../lib/'));


if (!options.paths.length) {
    console.error('No files given');
    process.exit(1);
}

var check = function(cb) {
    exec('phantomjs --version', function(stdin, stdout, stderr) {
        var version = stdout.replace('\n', '');
        cb(version);
    });
}

check(function(version) {
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

    if (options.exitOnFail) {
        util.log('--will exit on first test error');
    }
    if (options.concurrent) {
        for (var i = 1; i < options.concurrent; i++) {
            run();
        }
    } else {
        run();
    }
});

var testResults = [],
    counter = options.paths.length;

var run = function() {
    var file = options.paths.shift();
    if (file) {
        if (!existsSync(file) && !file.match(/^https?:\/\//)) {
            if (util.canPrint(options)) {
                util.error(':( Can not find file: ' + file);
            }
            process.exit(1);
        }
        
        var args = [
            wrapper,
            file
        ];
        if (options.timeout) {
            args.push(options.timeout);
        }
        var stdout = '';
        var child = spawn('phantomjs', args);
        child.stdout.on('data', function(data) {
            stdout += data;
        });
        child.on('exit', function() {
            var results = JSON.parse(stdout);
            testResults.push(results);
            if (util.canPrint(options, results)) {
                util.status(results);
            }
            if (options.exitOnFail && results.failed) {
                process.exit(1);
            }
            run();
        });
    } else {
        if (counter === testResults.length) {
            done();
        }
    }
};


var done = function() {
    if (options.outfile && options.outtype) {
        var proc = require(path.join(__dirname, '../lib/process')),
            fs = require('fs'),
            output = proc(testResults, options.outtype);
        
        if (!options.silent && !options.quiet) {
            util.log('Writing files in ' + options.outtype + ' format to: ' + options.outfile);
        }
        fs.writeFileSync(options.outfile, output, 'utf8');
    }
    var res = {
        name: 'Total',
        passed: 0,
        failed: 0,
        ignored: 0,
        total: 0
    };

    testResults.forEach(function(json) {
        res.passed += json.passed;
        res.failed += json.failed;
        res.total += json.total;
        res.ignored += json.ignored;
        if (json.jscoverage) {
            res.jscoverage = res.jscoverage || {};
            for (var i in json.jscoverage) {
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
            for (var i in json.yuiTestCoverage) {
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

    var END = (new Date()).getTime();
    if (!options.silent && !options.quiet) {
        console.log('----------------------------------------------------------------');
        util.status(res, START, END);
    }
    if (res.failed) {
        process.exit(1);
    }
};
