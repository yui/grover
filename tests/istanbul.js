var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    util = require('../lib/index'),
    cover = require('../lib/coverage'),
    exists = fs.existsSync || path.existsSync,
    grover = require('../lib/grover'),
    rimraf = require('rimraf'),
    report = path.join(__dirname, 'report'),
    runTest = function(file, timeout, cb) {
        if (!cb) {
            cb = timeout;
            timeout = '';
        }
        var options = [
            path.join(__dirname, file),
            '--coverage'
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

if (exists(report)) {
    rimraf.sync(report);
}

var tests = {
    'should execute a good test with istanbul': {
        topic: function() {
            var self = this,
                _exit = util.exit;
            util.exit = function() {};
            runTest('./html/istanbul.html', function(err, json) {
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
        'and should execute another good test with istanbul': {
            topic: function() {
                var self = this,
                    _exit = util.exit;
                util.exit = function() {};
                process.chdir(__dirname);
                runTest('./html/istanbul.html', [
                    '--istanbul-report',
                    report
                ],function(err, json) {
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
            'and should have report dirs': {
                topic: function() {
                    return fs.readdirSync(report)
                },
                'should have index.html': function(topic) {
                    var hasIndex = topic.some(function(file) {
                        return file === 'index.html'
                    });
                    assert.isTrue(hasIndex);
                },
                'should have yql/': function(topic) {
                    var hasIndex = topic.some(function(file) {
                        return file === 'yql'
                    });
                    assert.isTrue(hasIndex);
                }
            }
        }
    }
};

vows.describe('istanbul').addBatch(tests).export(module);
