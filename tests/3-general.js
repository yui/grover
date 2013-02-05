var vows = require('vows'),
    assert = require('assert'),
    grover = require('../lib/grover'),
    util = require('../lib/index'),
    chars = require('../lib/chars'),
    Stack = require('../lib/stack').Stack,
    platform = process.platform;

var tests = {
    'stack should produce errors': {
        topic: function(){
            var self = this,
            stack = new Stack(),
            fn = stack.add(function() {
            });

            fn(null);
            fn('error', null);

            stack.done(function() {
                self.callback(null, stack);
            });
        },
        'should produce 1 error': function(topic) {
            assert.equal(topic.errors.length, 1);
        },
        'should produce 1 result': function(topic) {
            assert.equal(topic.results.length, 1);
        }
    },
    'log.error should not exit': {
        topic: function() {
            var util = require('../lib/index'),
                _exit = util.exit;
            util.exit = function() {
                assert.ok(false);
            };

            util.error('This is a test');
            util.exit = _exit;
            return true;
        },
        'we are good': function(topic) {
            assert.ok(topic);
        }
    },
    'test color with no terminal': {
        topic: function() {
            var isTTY = process.stdout.isTTY, out;
            process.stdout.isTTY = false;
            util.init({ color: false });
            out = util.color('foo', 'red');
            process.stdout.isTTY = isTTY;
            return out;
        },
        'and output should be same as input': function(topic) {
            assert.equal(topic, 'foo');
        },
        'and with color': {
            topic: function() {
                return util.color('foo', 'red');
            }
        },
        'should not be the same as input': function(topic) {
            assert.notEqual(topic, 'red');
        }
    },
    'chars': {
        topic: function() {
            return chars;
        },
        'should return a good string': function(char) {
            assert.isString(char.good);
        },
        'should return a bad string': function(char) {
            assert.isString(char.bad);
        },
        'should return unix good char': function(char) {
            process.platform = 'linux';
            assert.equal(char.good, "✔");
            process.platform = platform;
        },
        'should return unix bad char': function(char) {
            process.platform = 'linux';
            assert.equal(char.bad, "✖");
            process.platform = platform;
        },
        'should return win32 good char': function(char) {
            process.platform = 'win32';
            assert.equal(char.good, "OK");
            process.platform = platform;
        },
        'should return win32 bad char': function(char) {
            process.platform = 'win32';
            assert.equal(char.bad, "X");
            process.platform = platform;
        }
    },
    'test canPrint': {
        topic: function() {
            return require('../lib').canPrint;
        },
        'should be a function': function(topic) {
            assert.isFunction(topic);
        },
        'should be true by default': function(topic) {
            assert.isTrue(topic());
        },
        'should be false if quiet': function(topic) {
            assert.isFalse(topic({ quiet: true }));
        },
        'should not be false if quiet and json.failed': function(topic) {
            assert.isTrue(topic({ quiet: true }, { failed: true }));
        },
        'should be false if silent': function(topic) {
            assert.isFalse(topic({ silent: true }));
        },
        'should be false if silent and json.failed': function(topic) {
            assert.isFalse(topic({ silent: true }, { failed: true }));
        }
    },
    'version': {
        topic: function() {
            var self = this;
            grover.check(function(version) {
                self.callback(null, version);
            });
        },
        'should be ok': function(topic) {
            assert.ok(topic);
        }
    },
    'init': {
        'null first arg': {
            topic: function() {
                var self = this;
                grover.init(null, function(version) {
                    self.callback(null, version);
                });
            },
            'should be ok': function(topic) {
                assert.ok(topic);
            }
        },
        'empty object': {
            topic: function() {
                var self = this;
                grover.init({
                }, function(version) {
                    self.callback(null, version);
                });
            },
            'should be ok': function(topic) {
                assert.ok(topic);
            }
        },
        'timeout': {
            topic: function() {
                var self = this;
                grover.init({
                    timeout: 2
                }, function(version) {
                    self.callback(null, version);
                });
            },
            'should be ok': function(topic) {
                assert.ok(topic);
            }
        },
        'quiet/silent/exitOnFail': {
            topic: function() {
                var self = this;
                grover.init({
                    silent: true,
                    quiet: true,
                    exitOnFail: true
                }, function(version) {
                    self.callback(null, version);
                });
            },
            'should be ok': function(topic) {
                assert.ok(topic);
            }
        }
    }
};

/*jshint es5: true */
vows.describe('general').addBatch(tests).export(module);
