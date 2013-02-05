var path = require('path'),
    fs = require('fs'),
    glob = require('glob'),
    util = require('./index'),
    log = require('./log'),
    VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')).version,
    parse = function(args) {
        var options = {
            color: true,
            port: 7000,
            'phantom-bin': 'phantomjs', // relies on PATH
            coverageWarn: 80,
            concurrent: 15,
            paths: [],
            outtype: 'tap',
            silent: false,
            run: true,
            quiet: false,
            debug: false,
            console: false,
            exitOnFail: false,
            istanbulReport: false,
            sourceFilePrefix: false,
            coverageFileName: false,
            combo: []
        }, newPath, paths, a, p, t, v, concurrent, coverageFileName, sourceFilePrefix,
        phantom, stat,
        getPaths = function(opt) {
            if (process.platform === 'win32' && !options.suffix) { //If options.suffix it's probably URL
                var g = glob.sync(opt, {
                    cwd: process.cwd()
                }).map(function (filepath) {
                    return path.join(process.cwd(), filepath);
                });
                if (g && g.length) {
                    options.paths = [].concat(options.paths, g);
                }
            } else {
                //shell exploded paths here
                options.paths.push(opt);
            }
        };

        while (args.length > 0) {
            v = args.shift();
            switch (v) {
                case "--combo":
                    p = args.shift().split(':');
                    options.combo.push({
                        root: p[1],
                        route: p[0]
                    });
                    break;
                case "--debug":
                    options.debug = true;
                    break;
                case "--console":
                    options.console = true;
                    break;
                case "--coverdir":
                    p = args.shift();
                    if (p) {
                        options.coverdir = path.resolve(p);
                    } else {
                        throw("--coverdir requires an argument");
                    }
                    break;
                case "--no-color":
                    options.color = false;
                    break;
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
                case "-co":
                case "--coverageFileName":
                    coverageFileName = args.shift();
                    if (coverageFileName) {
                        options.coverageFileName = coverageFileName;
                    } else {
                        throw("-co requires an argument");
                    }
                    break;
                case "-sp":
                case "--sourceFilePrefix":
                    sourceFilePrefix = args.shift();
                    if (sourceFilePrefix) {
                        options.sourceFilePrefix = sourceFilePrefix;
                    } else {
                        throw("-sp requires an argument");
                    }
                    break;
                case "--istanbul-report":
                    p = args.shift();
                    if (p) {
                        options.istanbulReport = p;
                    } else {
                        throw("Istanbul report needs a path");
                    }
                    break;
                case "--no-run":
                    options.run = false;
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
                case "--phantom-bin":
                    phantom = args.shift();
                    if (phantom) {
                        // allows "path/to/bin/" and "path/to/bin/phantomjs"
                        if (util.existsSync(phantom)) {
                            stat = fs.statSync(phantom);
                            if (stat && stat.isDirectory()) {
                                phantom = path.join(phantom, 'phantomjs');
                            }
                        }

                        // always make it an absolute path
                        phantom = path.resolve(phantom);

                        // make extra sure that the binary exists
                        if (util.existsSync(phantom)) {
                            options['phantom-bin'] = phantom;
                        } else {
                            throw "Custom phantomjs binary could not be found! (" + phantom + ")";
                        }
                    } else {
                        throw "--phantom-bin requires a path";
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
                    options['import'] = args.shift();
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
                    /*jshint maxlen: 200*/
                    util.log('Grover is a YUITest wrapper to run tests in PhantomJS');
                    log.log('Version ' + VERSION);
                    log.log('');
                    log.log('grover <paths to yuitest html files>');
                    log.log('   -v, --version Print version');
                    log.log('   -h, --help Print this stuff');
                    log.log('   -s, --silent Print no output, only use exit code');
                    log.log('   -q, --quiet Only print errors and use exit code');
                    log.log('   -f, --fail Fail on first error');
                    log.log('   -c, --concurrent Number of tests to run concurrently, default: 15');
                    log.log('   -t, --timeout Specify a timeout (in seconds) for a test file to be considered as failed.');
                    log.log('   -i, --import <path to js file> - Require this file and use the exports (array)');
                    log.log('           as the list of files to process.');
                    log.log('   -p, --prefix <string> String to prefix to all urls (for dynamic server names)');
                    log.log('   -S, --suffix <string> String to add to the end of all urls (for dynamic server names)');
                    log.log('   -o, --outfile <path to export file>');
                    log.log('       You can specify an export type with the following:');
                    log.log('       --tap TAP export (default)');
                    log.log('       --xml XML export');
                    log.log('       --json JSON export');
                    log.log('       --junit JUnit XML export');
                    log.log('   --server Starts a static file server in the CWD, tests should be relative to this directory');
                    log.log('   --port <Number> The port to start the server on');
                    log.log('   --phantom-bin <path to phantomjs executable> A non-PATH location for the phantomjs executable');
                    log.log('   --no-run Do not execute the tests, just prep the server (for other testing)');
                    log.log('   --no-color Force no terminal colors');
                    log.log('   --debug Show internal grover debugging info');
                    log.log('   --console Show console.* messages from the test page');
                    log.log('   --combo <route>:<rootPath> Attach a combo server with these settings');
                    log.log('       Example: --combo /combo:./lib --combo /combo/foo:./foo');
                    log.log('');
                    log.log('Coverage Options');
                    log.log('   --coverage Generate a coverage report and print it to the screen (you must instrument your own files first)');
                    log.log('   --coverage-warn <Number> The percentage to highlight as low coverage: default is 80');
                    log.log('   --istanbul-report <Path> Generate an Instabul coverage report into this directory');
                    log.log('   --coverdir <Path> generate a full lcov coverage report here');
                    log.log('   -co --coverageFileName <path to export coverage file> The coverage data in lcov format.');
                    log.log('   -sp --sourceFilePrefix <path to sourcefile> The relative path to the original source file for use in the coverage results.');
                    util.exit();
                    break;
                case "-v":
                case "--version":
                    log.error(VERSION);
                    util.exit(1);
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
                        log.error('Invalid option: ' + v);
                        util.exit(1);
                        break;
                    }
                    getPaths(v);
            }
        }

        if (options.timeout <=0 ) {
            options.timeout = null;
        }

        if (options['import']) {
            if (!util.existsSync(options['import']) || util.existsSync(path.join(process.cwd(), options['import']))) {
                options['import'] = path.join(process.cwd(), options['import']);
            }
            paths = require(options['import']);
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

exports.parse = parse;
