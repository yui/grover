var vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    grover = require('../lib/grover'),
    http = require('http'),
    events = require('events'),
    util = require('../lib/');

var Cont = function() {
    events.EventEmitter.call(this);
};
require('util').inherits(Cont, events.EventEmitter);
var cont = new Cont();

var statuses = {
    done: null,
    serving: null
};

process.send = function(msg) {
    Object.keys(msg).forEach(function(k) {
        statuses[k] = msg[k];
    });
};

var tests = {
    'should process several files': {
        topic: function() {
            var self = this,
                _exit = util.exit;

            util.exit = function() {};

            process.argv = [
                null,
                null,
                '--prefix',
                '/',
                '--concurrent',
                '5',
                '--no-run',
                '--server',
                path.join(__dirname, './html/good.html'),
                path.join(__dirname, './html/bad.html'),
                path.join(__dirname, './html/error.html'),
                path.join(__dirname, './html/echo.html')
            ];
            grover.process(function(err, results) {
                util.exit = _exit;
                cont.emit('results', results);
            });
            setTimeout(function() {
                self.callback(null, {});
            }, 300);
        },
        'and should have server listening': {
            topic: function() {
                var self = this;
                http.get({
                    url: '127.0.0.1',
                    port: 7000
                }, function(res) {
                    cont.emit('server');
                    self.callback(null, res.statusCode);
                });
            },
            'should serve a 404 as the default': function(topic) {
                assert.equal(topic, 404);
            }
        },
        'and should start tests': {
            topic: function() {
                var self = this;
                cont.on('results', function(results) {
                    self.callback(null, results);
                });
                cont.on('server', function() {
                    process.kill(process.pid, 'SIGCONT');
                });
            },
            'should have 4 sets of results': function(topic) {
                assert.equal(topic.length, 4);
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
            },
            'should 1 passing test in echo.html': function(topic) {
                var topics = topic.filter(function(item) {
                    return (item.name === 'echoecho suite');
                });
                assert.equal(topics[0].passed, 1);
            },
            'should have serving status': function() {
                assert.ok(statuses.serving);
            },
            'should have done status': function() {
                assert.ok(statuses.done);
            }
        }
    }
};

vows.describe('server').addBatch(tests).export(module);

