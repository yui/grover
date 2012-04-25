#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var wrapper = path.join(__dirname, '../lib/wrapper.js');
var options = require(path.join(__dirname, '../lib/options')).parse(process.argv.slice(2));

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
        if (options.timeout) {
            util.log('  Using a ' + options.timeout + ' second timeout per test.');
        }
    }

    if (options.exitOnFail) {
        util.log('--will exit on first test error');
    }
    run();
});

var testResults = [];

var run = function() {
    var file = options.paths.shift();
    if (file) {
        if (!path.existsSync(file)) {
            if (util.canPrint(options)) {
                util.error(':( Can not find file: ' + file);
            }
            process.exit(1);
        }
        var cmd = 'phantomjs ' + wrapper + ' ' + file;
        if (options.timeout) {
            cmd += ' ' + options.timeout;
        }
        exec(cmd, function(err, stdout) {
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
        done();
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
