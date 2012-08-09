var path = require('path'),
    fs = require('fs'),
    util = require('./index'),
    VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')).version,
    existsSync = fs.existsSync || path.existsSync,
    parse = function(args) {
        var options = {
            port: 4000,
            coverageWarn: 80,
            concurrent: 15,
            paths: [],
            outtype: 'tap',
            silent: false,
            quiet: false,
            exitOnFail: false
        }, newPath, paths, a, p, t, v, concurrent;

        while (args.length > 0) {
            v = args.shift();
            switch (v) {
                case "--coverage-warn":
                    a = args.shift();
                    p = parseInt(a, 10);
                    if (!isNaN(p)) {
                        options.coverageWarn = p;
                    } else {
                        throw('--coverage-warn requires a number argument');
                    }
                    break;
                case "--coverage":
                    options.coverage = true;
                    break;

                case "--server":
                    options.server = process.cwd();
                    break;
                case "--port":
                    a = args.shift();
                    p = parseInt(a, 10);
                    if (!isNaN(p)) {
                        options.port = p;
                    } else {
                        args.unshift(a);
                    }
                    break;
                case "-t":
                case "--timeout":
                    t = parseInt(args.shift(), 10);
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
                case "-S":
                case "--suffix":
                    p = args.shift();
                    if (p) {
                        options.suffix = p;
                    } else {
                        throw('-S requires an argument');
                    }
                    break;
                case "-p":
                case "--prefix":
                    p = args.shift();
                    if (p) {
                        options.prefix = p;
                    } else {
                        throw('-p requires an argument');
                    }
                    break;
                case "-f":
                case "--fail":
                    options.exitOnFail = true;
                    break;
                case "-c":
                case "--concurrent":
                    concurrent = parseInt(args.shift(), 10);
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
                    console.log('   -c, --concurrent Number of tests to run concurrently, default: 15');
                    console.log('   -t, --timeout Specify a timeout (in seconds) for a test file to be considered as failed.');
                    console.log('   -i, --import <path to js file> - Require this file and use the exports (array)');
                    console.log('           as the list of files to process.');
                    console.log('   -p, --prefix <string> String to prefix to all urls (for dynamic server names)');
                    console.log('   -S, --suffix <string> String to add to the end of all urls (for dynamic server names)');
                    console.log('   -o, --outfile <path to export file>');
                    console.log('       You can specify an export type with the following:');
                    console.log('       --tap TAP export (default)');
                    console.log('       --xml XML export');
                    console.log('       --json JSON export');
                    console.log('       --junit JUnit XML export');
                    console.log('   --server Starts a static file server in the CWD, tests should be relative to this directory');
                    console.log('   --port <Number> The port to start the server on');
                    console.log('   --coverage Generate a coverage report and print it to the screen (you must instrument your own files with YUITest first)');
                    console.log('   --coverage-warn <Number> The percentage to highlight as low coverage: default is 80');
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
            if (!existsSync(options.import) || existsSync(path.join(process.cwd(), options.import))) {
                options.import = path.join(process.cwd(), options.import);
            }
            paths = require(options.import);
            if (paths && paths.length) {
                options.paths = paths;
            }
        }

        if ((options.prefix || options.suffix) && options.paths && options.paths.length) {
            options.paths.forEach(function(p, i) {
                newPath = p;
                if (options.prefix) {
                    newPath = options.prefix + newPath;
                }
                if (options.suffix) {
                    newPath = newPath + options.suffix;
                }
                options.paths[i] = newPath;
            });
        }

        return options;
    };

module.exports = {
    parse: function(args) {
        return parse(args);
    }
};
