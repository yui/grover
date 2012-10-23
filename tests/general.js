var vows = require('vows'),
    assert = require('assert'),
    grover = require('../lib/grover'),
    timer = require('../lib/').timer;

var tests = {
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
