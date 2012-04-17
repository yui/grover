#!/usr/bin/env node

var path = require('path');
var exec = require('child_process').exec;
var wrapper = path.join(__dirname, '../lib/wrapper.js');
var args = process.argv.slice(2),
    options = {
        paths: [],
        outtype: 'tap',
        silent: false,
        quiet: false,
        exitOnFail: false
    };

var START = (new Date()).getTime();
var VERSION = require(path.join(__dirname, '../package.json')).version;
var util = require(path.join(__dirname, '../lib/'));

while (args.length > 0) {
    var v = args.shift();
    switch (v) {
        case "-i":
        case "--import":
            options.import = args.shift();
            break;
        case "-s":
        case "--silent":
            options.silent = true;
            break;
        case "-q":
        case "--quiet":
            options.quiet = true;
            break;
        case "-f":
        case "--fail":
            options.exitOnFail = true;
            break;
        case "-h":
        case "--help":
            util.log('Grover is a YUITest wrapper to run tests in PhantomJS');
            console.log('Version ' + VERSION);
            console.log('');
            console.log('grover <paths to yuitest html files>');
            console.log('   -v, --version Print version');
            console.log('   -h, --help Print this stuff');
            console.log('   -s, --silent Print no output, only use exit code');
            console.log('   -q, --quiet Only print errors and use exit code');
            console.log('   -f, --fail Fail on first error');
            console.log('   -i, --import <path to js file> - Require this file and use the exports (array)');
            console.log('           as the list of files to process.');
            console.log('   -o, --outfile <path to export file>');
            console.log('       You can specify an export type with the following:');
            console.log('       --tap TAP export (default)');
            console.log('       --xml XML export');
            console.log('       --json JSON export');
            console.log('       --junit JUnit XML export');
            process.exit();
            break;
        case "-v":
        case "--version":
            console.error(VERSION);
            process.exit(1);
            break;
        case "-o":
        case "--outfile":
            options.outfile = args.shift();
            break;
        case "--tap":
            options.outtype = 'TAP';
            break;
        case "--json":
            options.outtype = 'JSON';
            break;
        case "--xml":
            options.outtype = 'XML';
            break;
        case "--junit":
            options.outtype = 'JUnitXML';
            break;
        default:
            if (v.indexOf('-') === 0) {
                console.error('Invalid option: ' + v);
                process.exit(1);
                break;
            }
            options.paths.push(v);
    }
}

if (options.import) {
    if (!path.existsSync(options.import) || path.existsSync(path.join(process.cwd(), options.import))) {
        options.import = path.join(process.cwd(), options.import);
    }
    var paths = require(options.import);
    if (paths && paths.length) {
        options.paths = paths;
    }
}

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
    }
    if (options.exitOnFail) {
        util.log('--will exit on first test error');
    }
    run();
});

var testResults = [];

var canPrint = function(json) {
    json = json || {}
    var p = true;
    if (options.quiet) {
        p = false;
        if (json.failed) {
            p = true;
        }
    }
    if (options.silent) {
        p = false;
    }
    return p;
};

var run = function() {
    var file = options.paths.shift();
    if (file) {
        if (!path.existsSync(file)) {
            if (canPrint()) {
                util.error(':( Can not find file: ' + file);
            }
            process.exit(1);
        }
        var cmd = 'phantomjs ' + wrapper + ' ' + file;
        exec(cmd, function(err, stdout) {
            var results = JSON.parse(stdout);
            testResults.push(results);
            if (canPrint(results)) {
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
        console.log('---------------------------------------');
        util.status(res, START, END);
    }
    if (res.failed) {
        process.exit(1);
    }
};
