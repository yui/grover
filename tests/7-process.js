var vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    grover = require('../lib/grover'),
    util = require('../lib/');

var tests = {
    'should process several files': {
        topic: function() {
            var self = this,
                _exit = util.exit;

            util.exit = function() {};

            process.argv = [
                null,
                null,
                '--concurrent',
                '5',
                '--console',
                '--no-run',
                path.join(__dirname, './html/good.html'),
                path.join(__dirname, './html/bad.html'),
                path.join(__dirname, './html/error.html')
            ];
            grover.process(function(err, results) {
                util.exit = _exit;
                self.callback(err, results);
            });
            setTimeout(function() {
                process.kill(process.pid, 'SIGCONT');
            }, 3500);
        },
        'should have results': function(topic) {
            assert.ok(topic);
        },
        'should have 3 sets of results': function(topic) {
            assert.equal(topic.length, 3);
        },
        'should have 50 passing tests in Suite #1': function(topic) {
            var topics = topic.filter(function(item) {
                return (item.name === 'Suite #1');
            });
            assert.equal(topics[0].passed, 50);
        },
        'should have 0 failing tests in Suite #1': function(topic) {
            var topics = topic.filter(function(item) {
                return (item.name === 'Suite #1');
            });
            assert.equal(topics[0].failed, 0);
        },
        'should have 5 passing tests in Suite Bad': function(topic) {
            var topics = topic.filter(function(item) {
                return (item.name === 'Suite Bad');
            });
            assert.equal(topics[0].passed, 5);
        },
        'should have 5 failing tests in Suite Bad': function(topic) {
            var topics = topic.filter(function(item) {
                return (item.name === 'Suite Bad');
            });
            assert.equal(topics[0].failed, 5);
        },
        'should 1 failing test in error.html': function(topic) {
            var topics = topic.filter(function(item) {
                return (item.name.indexOf('error.html') > -1);
            });
            assert.equal(topics[0].failed, 1);
        }
    }
};

/*jshint es5: true */
vows.describe('process SIGINT').addBatch(tests).export(module);

