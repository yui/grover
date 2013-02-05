var vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    parse = require(path.join(__dirname, '../lib/options')).parse;

var log = require('../lib/log');

log.log = log.error = function(str) { return str; };

var tests = {
    '--combo /combo:./build': {
        topic: function() {
            return parse(['--combo', '/combo:./build']);
        },
        'combo should contain proper items': function(topic) {
            assert.isArray(topic.combo);
            assert.equal(topic.combo.length, 1);
        }
    },
    '--console': {
        topic: function() {
            return parse(['--console']);
        },
        'console should be true': function(topic) {
            assert.isTrue(topic.console);
        }
    },
    '--debug': {
        topic: function() {
            return parse(['--debug']);
        },
        'debug should be true': function(topic) {
            assert.isTrue(topic.debug);
        }
    },
    '--no-color': {
        topic: function() {
            return parse(['--no-color']);
        },
        'color should be false': function(topic) {
            assert.isFalse(topic.color);
        }
    },
    '--coverdir': {
        topic: function() {
            return parse(['--coverdir', '/foo/bar']);
        },
        'coverdir should not be undefined': function(topic) {
            assert.ok(topic.coverdir);
        }
    },
    '--coverdir with no param': {
        topic: function() {
            return parse(['--coverdir']);
        },
        'should error': function(topic) {
            assert.equal(topic, '--coverdir requires an argument');
        }
    },
    'check timeout number shorthand': {
        topic: function() {
            return parse(['-t', '3']);
        },
        'should be 3': function(topic) {
            assert.equal(topic.timeout, 3);
        }
    },
    'check timeout number': {
        topic: function() {
            return parse(['--timeout', '3']);
        },
        'should be 3': function(topic) {
            assert.equal(topic.timeout, 3);
        }
    },
    'check timeout -1 shorthand': {
        topic: function() {
            return parse(['-t', '-1']);
        },
        'should be null': function(topic) {
            assert.isNull(topic.timeout);
        }
    },
    'check timeout -1': {
        topic: function() {
            return parse(['--timeout', '-1']);
        },
        'should be null': function(topic) {
            assert.isNull(topic.timeout);
        }
    },
    'check timeout string shorthand': {
        topic: function() {
            return parse(['-t', 'foobar']);
        },
        'should be undefined': function(topic) {
            assert.isUndefined(topic.timeout);
        }
    },
    'check timeout string': {
        topic: function() {
            return parse(['--timeout', 'foobar']);
        },
        'should be undefined': function(topic) {
            assert.isUndefined(topic.timeout);
        }
    },
    'check booleans shorthand': {
        topic: function() {
            return parse(['-s', '-q', '-f']);
        },
        'should all be true': function(topic) {
            assert.isTrue(topic.silent);
            assert.isTrue(topic.quiet);
            assert.isTrue(topic.exitOnFail);
        }
    },
    'check booleans': {
        topic: function() {
            return parse(['--silent', '--quiet', '--fail']);
        },
        'should all be true': function(topic) {
            assert.isTrue(topic.silent);
            assert.isTrue(topic.quiet);
            assert.isTrue(topic.exitOnFail);
        }
    },
    'check suffix -- <none>': {
        topic: function() {
            return parse(['-p', 'http://localhost:300/', 'foo.html', 'path/to/file.html', '-S']);
        },
        'should throw error': function(topic) {
            assert.equal(topic, '-S requires an argument');
        }
    },
    'check suffix -- shorthand': {
        topic: function() {
            return parse(['-p', 'http://localhost:300/', '-S', '?foo=bar', 'foo.html', 'path/to/file.html']);
        },
        'should parse paths': function(topic) {
            assert.equal(topic.paths.length, 2);
        },
        'should add prefix': function(topic) {
            assert.equal(topic.paths[0], 'http://localhost:300/foo.html?foo=bar');
            assert.equal(topic.paths[1], 'http://localhost:300/path/to/file.html?foo=bar');
        }
    },
    'check suffix': {
        topic: function() {
            return parse(['-p', 'http://localhost:300/', '--suffix', '?foo=bar', 'foo.html', 'path/to/file.html']);
        },
        'should parse paths': function(topic) {
            assert.equal(topic.paths.length, 2);
        },
        'should add prefix': function(topic) {
            assert.equal(topic.paths[0], 'http://localhost:300/foo.html?foo=bar');
            assert.equal(topic.paths[1], 'http://localhost:300/path/to/file.html?foo=bar');
        }
    },
    'check prefix -- without suffix': {
        topic: function() {
            return parse(['-p', 'http://localhost:300/', 'foo.html', 'path/to/file.html']);
        },
        'should parse paths': function(topic) {
            assert.equal(topic.paths.length, 2);
        },
        'should add prefix': function(topic) {
            assert.equal(topic.paths[0], 'http://localhost:300/foo.html');
            assert.equal(topic.paths[1], 'http://localhost:300/path/to/file.html');
        }
    },
    'check suffix -- without prefix': {
        topic: function() {
            return parse(['-S', '.php', 'foo.html', 'path/to/file.html']);
        },
        'should parse paths': function(topic) {
            assert.equal(topic.paths.length, 2);
        },
        'should add prefix': function(topic) {
            assert.equal(topic.paths[0], 'foo.html.php');
            assert.equal(topic.paths[1], 'path/to/file.html.php');
        }
    },
    'check prefix -- shorthand': {
        topic: function() {
            return parse(['-p', 'http://localhost:300/', 'foo.html', 'path/to/file.html']);
        },
        'should parse paths': function(topic) {
            assert.equal(topic.paths.length, 2);
        },
        'should add prefix': function(topic) {
            assert.equal(topic.paths[0], 'http://localhost:300/foo.html');
            assert.equal(topic.paths[1], 'http://localhost:300/path/to/file.html');
        }
    },
    'check prefix': {
        topic: function() {
            return parse(['--prefix', 'http://localhost:300/', 'foo.html', 'path/to/file.html']);
        },
        'should parse paths': function(topic) {
            assert.equal(topic.paths.length, 2);
        },
        'should add prefix': function(topic) {
            assert.equal(topic.paths[0], 'http://localhost:300/foo.html');
            assert.equal(topic.paths[1], 'http://localhost:300/path/to/file.html');
        }
    },
    'check prefix -- none': {
        topic: function() {
            return parse(['foo.html', 'path/to/file.html', '-p']);
        },
        'should add prefix': function(topic) {
            assert.equal(topic, '-p requires an argument');
        }
    },
    '--concurrent -- foo': {
        topic: function() {
            return parse(['-c', 'foobar']);
        },
        'should have 15': function(topic) {
            assert.equal(topic.concurrent, 15);
        }
    },
    '--concurrent -- 0': {
        topic: function() {
            return parse(['-c', '0']);
        },
        'should have 15': function(topic) {
            assert.equal(topic.concurrent, 15);
        }
    },
    '--concurrent -- shorthand': {
        topic: function() {
            return parse(['-c', 35]);
        },
        'should have 35': function(topic) {
            assert.equal(topic.concurrent, 35);
        }
    },
    '--concurrent': {
        topic: function() {
            return parse(['--concurrent', 25]);
        },
        'should have 25': function(topic) {
            assert.equal(topic.concurrent, 25);
        }
    },
    'check --server': {
        topic: function() {
            return parse(['--server', 'foo.html', 'path/to/file.html']);
        },
        'should parse paths': function(topic) {
            assert.equal(topic.paths.length, 2);
        },
        'should set server root': function(topic) {
            assert.equal(topic.server, process.cwd());
        },
        'should set default port': function(topic) {
            assert.equal(topic.port, 7000);
        }
    },
    'check --server --port 9000': {
        topic: function() {
            return parse(['--server', '--port', '9000', 'foo.html', 'path/to/file.html']);
        },
        'should parse paths': function(topic) {
            assert.equal(topic.paths.length, 2);
        },
        'should set server root': function(topic) {
            assert.equal(topic.server, process.cwd());
        },
        'should set default port': function(topic) {
            assert.equal(topic.port, 9000);
        }
    },
    'check --server --port foobar': {
        topic: function() {
            return parse(['--server', '--port', 'foobar', 'foo.html', 'path/to/file.html']);
        },
        'should parse paths': function(topic) {
            assert.equal(topic.paths.length, 3);
        },
        'should set server root': function(topic) {
            assert.equal(topic.server, process.cwd());
        },
        'should set default port': function(topic) {
            assert.equal(topic.port, 7000);
        }
    },
    'check --no-run': {
        topic: function() {
            return parse(['--no-run']);
        },
        'run should be false': function(topic) {
            assert.isFalse(topic.run);
        }
    },
    'check --import': {
        topic: function() {
            return parse(['--import', './tests/build/import.js']);
        },
        'should be path': function(topic) {
            assert.equal(topic['import'], path.join(__dirname, '../tests/build/import.js'));
        },
        'should have 3 paths from import': function(topic) {
            assert.equal(topic.paths.length, 3);
        }
    },
    'check --import full path': {
        topic: function() {
            return parse(['--import', path.join(__dirname, '../tests/build/import.js')]);
        },
        'should be path': function(topic) {
            assert.equal(topic['import'], path.join(__dirname, '../tests/build/import.js'));
        },
        'should have 3 paths from import': function(topic) {
            assert.equal(topic.paths.length, 3);
        }
    },
    'check --import ./does/not/exist.js': {
        topic: function() {
            return parse(['--import', './does/not/exist.js']);
        },
        'should be path': function(topic) {
            assert.isUndefined(topic['import']);
        }
    },
    'check --import <shorthand>': {
        topic: function() {
            return parse(['-i', './tests/1-args.js']);
        },
        'should be path': function(topic) {
            assert.equal(topic['import'], path.join(__dirname, '../tests/1-args.js'));
        }
    },
    '--coverage': {
        topic: function() {
            return parse(['--coverage']);
        },
        'should have coverage': function(topic) {
            assert.isTrue(topic.coverage);
        }
    },
    '--coverage-warn 80': {
        topic: function() {
            return parse(['--coverage-warn', 80]);
        },
        'should have coverage': function(topic) {
            assert.equal(topic.coverageWarn, 80);
        }
    },
    '--coverage-warn foobar': {
        topic: function() {
            return parse(['--coverage-warn', 'foobar']);
        },
        'should have coverage': function(topic) {
            assert.equal(topic, '--coverage-warn requires a number argument');
        }
    },
    'check coverage prefix (sp)': {
        topic: function() {
            return parse(['-sp', '../']);
        },
        'should have prefix': function(topic) {
            assert.equal(topic.sourceFilePrefix, '../');
        }
    },
    'check coverage prefix (sourceFilePrefix)': {
        topic: function() {
            return parse(['--sourceFilePrefix', '../']);
        },
        'should have prefix': function(topic) {
            assert.equal(topic.sourceFilePrefix, '../');
        }
    },
    'check coverage prefix (sourceFilePrefix) -- none': {
        topic: function() {
            return parse(['--sourceFilePrefix']);
        },
        'should have prefix': function(topic) {
            assert.equal(topic, '-sp requires an argument');
        }
    },
    'check coverage filename (co)': {
        topic: function() {
            return parse(['-co', 'lcov.info']);
        },
        'should have filename': function(topic) {
            assert.equal(topic.coverageFileName, 'lcov.info');
        }
    },
    'check coverage filename (coverageFileName)': {
        topic: function() {
            return parse(['--coverageFileName', 'lcov.info']);
        },
        'should have filename': function(topic) {
            assert.equal(topic.coverageFileName, 'lcov.info');
        }
    },
    'check coverage filename (coverageFileName) - bad': {
        topic: function() {
            return parse(['--coverageFileName']);
        },
        'should have filename': function(topic) {
            assert.equal(topic, '-co requires an argument');
        }
    },
    '--istanbul-report <path>': {
        topic: function() {
            return parse(['--istanbul-report', './report/']);
        },
        'should have filename': function(topic) {
            assert.equal(topic.istanbulReport, './report/');
        }
    },
    '--istanbul-report': {
        topic: function() {
            return parse(['--istanbul-report']);
        },
        'should have filename': function(topic) {
            assert.equal(topic, 'Istanbul report needs a path');
        }
    },
    '--outfile': {
        topic: function() {
            return parse(['--outfile']);
        },
        'should be undefined': function(topic) {
            assert.equal(topic.outfile, undefined);
        }
    },
    '-o': {
        topic: function() {
            return parse(['-o']);
        },
        'should be undefined': function(topic) {
            assert.equal(topic.outfile, undefined);
        }
    },
    '--outfile ./foobar': {
        topic: function() {
            return parse(['--outfile', './foobar']);
        },
        'should have filename': function(topic) {
            assert.equal(topic.outfile, './foobar');
        }
    },
    '--junit': {
        topic: function() {
            return parse(['--junit']);
        },
        'outtype should be set': function(topic) {
            assert.equal(topic.outtype, 'JUnitXML');
        }
    },
    '--xml': {
        topic: function() {
            return parse(['--xml']);
        },
        'outtype should be set': function(topic) {
            assert.equal(topic.outtype, 'XML');
        }
    },
    '--json': {
        topic: function() {
            return parse(['--json']);
        },
        'outtype should be set': function(topic) {
            assert.equal(topic.outtype, 'JSON');
        }
    },
    '--tap': {
        topic: function() {
            return parse(['--tap']);
        },
        'outtype should be set': function(topic) {
            assert.equal(topic.outtype, 'TAP');
        }
    },
    '--phantom-bin (default)': {
        topic: function () {
            return parse([]);
        },
        'should default phantom executable to use PATH': function (topic) {
            assert.equal(topic['phantom-bin'], 'phantomjs');
        }
    },
    '--phantom-bin (empty)': {
        topic: function () {
            return parse(['--phantom-bin']);
        },
        'should require an argument if option passed': function (topic) {
            assert.equal(topic, '--phantom-bin requires a path');
        }
    },
    '--phantom-bin (bad path)': {
        topic: function () {
            return parse(['--phantom-bin', path.join(__dirname, '../tests/missing/phantomjs')]);
        },
        'should reject path when executable not found': function (topic) {
            assert.ok(topic.indexOf('Custom phantomjs binary could not be found!') > -1);
        }
    },
    '--phantom-bin path/to/bin': {
        topic: function () {
            return parse(['--phantom-bin', './tests/build/bin']);
        },
        'should add phantomjs executable to customized phantom path': function (topic) {
            assert.equal(topic['phantom-bin'], path.join(__dirname, '../tests/build/bin/phantomjs'));
        }
    },
    '--phantom-bin path/to/bin/phantomjs-1.8.0': {
        topic: function () {
            return parse(['--phantom-bin', './tests/build/bin/phantomjs-1.8.0']);
        },
        'should use custom executable name': function (topic) {
            assert.equal(topic['phantom-bin'], path.join(__dirname, '../tests/build/bin/phantomjs-1.8.0'));
        }
    },
    '--phantom-bin path/to/bin/phantomjs': {
        topic: function () {
            return parse(['--phantom-bin', './tests/build/bin/phantomjs']);
        },
        'should accept full path to custom phantomjs location': function (topic) {
            assert.equal(topic['phantom-bin'], path.join(__dirname, '../tests/build/bin/phantomjs'));
        }
    },
    '--phantom-bin /absolute/path/to/bin/phantomjs': {
        topic: function () {
            return parse(['--phantom-bin', path.join(__dirname, '../tests/build/bin/phantomjs')]);
        },
        'should accept absolute phantom path & executable': function (topic) {
            assert.equal(topic['phantom-bin'], path.join(__dirname, '../tests/build/bin/phantomjs'));
        }
    },
    '--help': {
        topic: function() {
            var self = this,
                _exit = process.exit;
            process.exit = function(code) {
                self.callback(null, code);
                process.exit = _exit;
            };
            parse(['--help']);
        },
        'should print help': function(topic) {
            assert.isUndefined(topic);
        }
    },
    '-h': {
        topic: function() {
            var self = this,
                _exit = process.exit;
            process.exit = function(code) {
                self.callback(null, code);
                process.exit = _exit;
            };
            parse(['-h']);
        },
        'should print help': function(topic) {
            assert.isUndefined(topic);
        }
    },
    '--version': {
        topic: function() {
            var self = this,
                _exit = process.exit;
            process.exit = function(code) {
                self.callback(null, code);
                process.exit = _exit;
            };
            parse(['--version']);
        },
        'should print version': function(topic) {
            assert.ok(topic);
        }
    },
    '-v': {
        topic: function() {
            var self = this,
                _exit = process.exit;
            process.exit = function(code) {
                self.callback(null, code);
                process.exit = _exit;
            };
            parse(['-v']);
        },
        'should print version': function(topic) {
            assert.ok(topic);
        }
    },
    '--crap': {
        topic: function() {
            var self = this,
                _exit = process.exit;
            process.exit = function(code) {
                self.callback(null, code);
                process.exit = _exit;
            };
            parse(['--crap']);
        },
        'should print error': function(topic) {
            assert.ok(topic);
        }
    },
    'getPaths': {
        'good files': {
            topic: function() {
                var _platform = process.platform, ret;
                process.platform = 'win32';
                ret = parse(['./tests/html/*.html']);
                process.platform = _platform;
                return ret;
            },
            'should expand 7 paths': function(topic) {
                assert.equal(topic.paths.length, 7);
            }
        },
        'no files': {
            topic: function() {
                var _platform = process.platform, ret;
                process.platform = 'win32';
                ret = parse(['./tests/html/*.php']);
                process.platform = _platform;
                return ret;
            },
            'should expand 0 paths': function(topic) {
                assert.equal(topic.paths.length, 0);
            }
        }
    }
};

/*jshint es5: true */
vows.describe('arguments').addBatch(tests).export(module);
