/*jshint unused: false */
var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    util = require('../lib/index'),
    rimraf = require('rimraf'),
    cover = require('../lib/coverage'),
    exists = fs.existsSync || path.existsSync,
    grover = require('../lib/grover'),
    runTest = function(file, timeout, cb) {
        if (!cb) {
            cb = timeout;
            timeout = '';
        }
        var options = [
            '--coverage',
            path.join(__dirname, file)
        ];
        if (timeout && Array.isArray(timeout)) {
            timeout.forEach(function(i) {
                options.push(i);
            });
        }

        grover.process(options, function(err, json) {
            cb(err, json[0]);
        });
    };

var tests = {
    'should execute a good test with yuitest': {
        topic: function() {
            var self = this,
                _exit = util.exit;
            util.exit = function() {};
            runTest('./html/yuitest.html', function(err, json) {
                util.exit = _exit;
                self.callback(err, json);
            });
        },
        'and have suite name': function(json) {
            assert.equal(json.name, 'YQL');
        },
        'and should have 8 passing tests': function(json) {
            assert.equal(json.passed, 8);
        },
        'and should have 0 failed tests': function(json) {
            assert.equal(json.failed, 0);
        },
        'and with coverage warn': {
            topic: function() {
                var self = this,
                    _exit = util.exit;
                util.exit = function() {};
                process.chdir(__dirname);
                runTest('./html/yuitest.html', [
                    '--coverage-warn',
                    '101',
                    '--sourceFilePrefix',
                    process.cwd(),
                    '--silent',
                    '--outfile',
                    path.join(__dirname, 'out/json.info'),
                    '--json'
                ], function(err, json) {
                    util.exit = _exit;
                    self.callback(err, json);
                });
            },
            'and have suite name': function(json) {
                assert.equal(json.name, 'YQL');
            },
            'and should have 8 passing tests': function(json) {
                assert.equal(json.passed, 8);
            },
            'and should have 0 failed tests': function(json) {
                assert.equal(json.failed, 0);
            },
            'and have outfile': function(json) {
                var stat = fs.statSync(path.join(__dirname, 'out/json.info'));
                assert.ok(stat);
            },
            'and with invalid sourceFilePrefix': {
                topic: function() {
                    var self = this,
                        _exit = util.exit;
                    util.exit = function() {};
                    process.chdir(__dirname);
                    runTest('./html/yuitest.html', [
                        '--coverage-warn',
                        '101',
                        '--sourceFilePrefix',
                        path.join(process.cwd(), '../../')
                    ], function(err, json) {
                        util.exit = _exit;
                        self.callback(err, json);
                    });
                },
                'and have suite name': function(json) {
                    assert.equal(json.name, 'YQL');
                },
                'and should have 8 passing tests': function(json) {
                    assert.equal(json.passed, 8);
                },
                'and should have 0 failed tests': function(json) {
                    assert.equal(json.failed, 0);
                },
                'should execute multiple tests and report proper results': {
                    topic: function() {
                        var self = this,
                            tapFile = path.join(__dirname, './tap/output.tap'),
                            _exit = util.exit;
                        util.exit = function() {};
                        process.chdir(__dirname);

                        if (exists(tapFile)) {
                            rimraf.sync(tapFile);
                        }

                        runTest('tap/mymodule/tests/unit/index.html', [
                            '--tap',
                            '-o',
                            tapFile,
                            path.join(__dirname, './tap/myothermodule/tests/unit/index.html')
                        ], function(err, json) {
                            util.exit = _exit;
                            var data = {
                                file: exists(tapFile),
                                str: fs.readFileSync(tapFile).toString()
                            };
                            self.callback(err, data);
                        });
                    },
                    'and write tap file': function(topic) {
                        assert.isTrue(topic.file);
                    },
                    'and tap file contains 6 tests': function(topic) {
                        var line = topic.str.split('\n')[0];
                        assert.equal(line, '1..6');
                    },
                    'and should have 11 lines': function(topic) {
                        var lines = topic.str.trim().split('\n').length;
                        assert.equal(lines, 11);
                    }
                }
            }
        }
    }
};

/*jshint es5: true */
vows.describe('yuitest').addBatch(tests).export(module);
