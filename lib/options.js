
var path = require('path');
var fs = require('fs');
var util = require('./index');
var VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')).version;

var parse = function(args) {
    var options = {
        concurrent: 15,
        paths: [],
        outtype: 'tap',
        silent: false,
        quiet: false,
        exitOnFail: false
    };

    while (args.length > 0) {
        var v = args.shift();
        switch (v) {
            case "-t":
            case "--timeout":
                var t = parseInt(args.shift());
                if (!isNaN(t)) {
                    options.timeout = t;
                }
                break;
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
            case "-c":
            case "--concurrent":
                var concurrent = parseInt(args.shift(), 10);
                if (!isNaN(concurrent)) {
                    if (concurrent > 1) {
                        options.concurrent = concurrent;
                    }
                }
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
                console.log('   -c, --concurret Number of tests to run concurrently, default: 15');
                console.log('   -t, --timeout Specify a timeout (in seconds) for a test file to be considered as failed.');
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

    if (options.timeout <=0 ) {
        options.timeout = null;
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

    return options;
};

module.exports = {
    parse: function(args) {
        return parse(args);
    }
};
