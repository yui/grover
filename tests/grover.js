var vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    exec = require('child_process').exec,
    wrapper = path.join(__dirname, '../lib/wrapper/wrapper.js'),
    grover = require('../lib/grover'),
    util = require('../lib/'),
    runTest = function(file, timeout, cb) {
        if (!cb) {
            cb = timeout;
            timeout = '';
        }
        var options = {
            concurrent: 15,
            paths: [
                path.join(__dirname, file)
            ]
        };
        if (timeout && timeout > 0) {
            options.timeout = timeout;
        }
        if (Array.isArray(timeout)) {
            options[timeout[0]] = timeout[1];
        }
        grover.dispatch(options, function(err, json) {
            cb(err, json[0]);
        });
    };

//Testing overrides

var tests = {
    'should execute a good test': {
        topic: function() {
            var self = this;
            runTest('./html/good.html', [
                'exitOnFail', true
            ], function(err, json) {
                self.callback(err, json);
            });
        },
        'and have suite name': function(json) {
            assert.equal(json.name, 'Suite #1');
        },
        'and should have 50 passing tests': function(json) {
            assert.equal(json.passed, 50);
        },
        'and should have 0 failed tests': function(json) {
            assert.equal(json.failed, 0);
        }
    },
    'should execute failing tests': {
        topic: function() {
            var self = this,
                code,
                _exit = util.exit;

            util.exit = function(c) {
                code = c;
            };

            runTest('./html/bad.html', [
                'exitOnFail', true
            ], function(err, json) {
                util.exit = _exit;
                self.callback(err, {
                    json: json,
                    code: code
                });
            });
        },
        'and have suite name': function(json) {
            assert.equal(json.json.name, 'Suite Bad');
        },
        'and should have 5 passing tests': function(json) {
            assert.equal(json.json.passed, 5);
        },
        'and should have 5 failing tests': function(json) {
            assert.equal(json.json.failed, 5);
        },
        'and should exit': function(json) {
            assert.equal(json.code, 1);
        }
    },
    'should handle errors': {
        topic: function() {
            var self = this;
            runTest('./html/error.html', [
                'silent', true
            ], function(err, json) {
                self.callback(null, json);
            });
        },
        'and have suite name': function(json) {
            var p = path.join(__dirname, './html/error.html');
            assert.equal(json.name, p);
        },
        'and should have 0 passing tests': function(json) {
            assert.equal(json.passed, 0);
        },
        'and should have 1 failing test': function(json) {
            assert.equal(json.failed, 1);
        },
        'and should have 1 error message': function(json) {
            assert.ok(json.error);
        }
    },
    'should print outfile': {
        topic: function() {
            var self = this;
            runTest('./html/error.html', function(err, json) {
                self.callback(null, json);
            });
        },
        'and have suite name': function(json) {
            var p = path.join(__dirname, './html/error.html');
            assert.equal(json.name, p);
        },
        'and should have 0 passing tests': function(json) {
            assert.equal(json.passed, 0);
        },
        'and should have 1 failing test': function(json) {
            assert.equal(json.failed, 1);
        },
        'and should have 1 error message': function(json) {
            assert.ok(json.error);
        }
    },
    'should handle bad file': {
        topic: function() {
            var self = this,
                _exit = util.exit,
                _error = util.error,
                code,
                msg;
            util.exit = function(c) {
                code = c;
            };
            util.error = function(m) {
                msg = m;
            };
            runTest('./html/noexist.html', function(err, json) {
                util.exit = _exit;
                util.erro = _error;
                self.callback(null, {
                    code: code,
                    message: msg,
                    json: json
                });
            });
        },
        'and should exit code 1': function(json) {
            assert.equal(json.code, 1);
        },
        'and should throw error': function(json) {
            assert.equal(json.message, ':( Can not find file: ' + path.join(__dirname, '/html/noexist.html'));
        },
        'and should have one failed test': function(json) {
            assert.equal(json.json.failed, 1);
        }
    },
    'should handle timeouts': {
        topic: function() {
            var self = this;
            runTest('./html/timeout.html', 1, function(err, json) {
                self.callback(null, json);
            });
        },
        'and have suite name': function(json) {
            var p = path.join(__dirname, './html/timeout.html');
            assert.equal(json.name, p);
        },
        'and should have 0 passing tests': function(json) {
            assert.equal(json.passed, 0);
        },
        'and should have 1 failing test': function(json) {
            assert.equal(json.failed, 1);
        },
        'and should have 1 error message': function(json) {
            assert.ok(json.error);
        },
        'and should show timeout error message': function(json) {
            assert.equal(json.error, 'Script Timeout');
        }
    }
};

vows.describe('grover').addBatch(tests).export(module);
