var vows = require('vows'),
    assert = require('assert'),
    grover = require('../lib/grover'),
    chars = require('../lib/chars'),
    timer = require('../lib/').timer,
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
            var util = require('../lib/index');
            var _exit = util.exit;
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
    //No way to simulate this without hourly tests
    'timer should work with hours': {
        topic: function() {
            var start = new Date('1/1/2010 3:00:00'),
                end = new Date('1/1/2110 5:43:21');
            return timer(start.getTime(), end.getTime());
        },
        'should print': function(topic) {
            assert.equal(topic, '2 hours, 43 minutes, 21 seconds');
        }
    },
    //No way to simulate this without tests taking forever
    'timer should work with minutes': {
        topic: function() {
            var start = new Date('1/1/2010 3:00:00'),
                end = new Date('1/1/2110 3:21:01');
            return timer(start.getTime(), end.getTime());
        },
        'should print': function(topic) {
            assert.equal(topic, '21 minutes, 1 seconds');
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
            return require('../lib').canPrint
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

vows.describe('general').addBatch(tests).export(module);
