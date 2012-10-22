var vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    exec = require('child_process').exec,
    wrapper = path.join(__dirname, '../lib/wrapper/wrapper.js'),
    cover = require(path.join(__dirname, '../lib/coverage')),
    runTest = function(file, timeout, cb) {
        if (!cb) {
            cb = timeout;
            timeout = '';
        }
        var cmd = 'phantomjs ' + wrapper + ' ' + path.join(__dirname, file) + ' ' + timeout;
        //console.log('Executing: ', cmd);
        exec(cmd, cb);
    },
    coverageData = {"build/foo/foo.js": {
            lines: {
                '1': 1,
                '2': 2,
                '3': 3,
                '4': 0
            },
            functions: {
                'init:1': 1,
                'foo:2': 2,
                '(anonymous 1):3': 3
            },
            coveredLines: 4,
            calledLines: 3,
            coveredFunctions: 3,
            calledFunctions: 3,
            path: 'build/foo/foo.js'
        }
    },
    coverageFile = "TN:lcov.info\n\
SF:" + path.join(__dirname, 'build/foo/foo.js') + "\n\
FN:1,init\n\
FN:2,foo\n\
FN:3,(anonymous 1)\n\n\
FNDA:1,init\n\
FNDA:2,foo\n\
FNDA:3,(anonymous 1)\n\n\
FNF:3\n\
FNH:3\n\
DA:1,1\n\
DA:2,2\n\
DA:3,3\n\
DA:4,0\n\n\
LF:4\n\
LH:3\n\n\
end_of_record\n\n";

var tests = {
    'should execute a good test': {
        topic: function() {
            var self = this;
            runTest('./html/good.html', function(err, stdout, stderr) {
                self.callback(err, JSON.parse(stdout));
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
            var self = this;
            runTest('./html/bad.html', function(err, stdout) {
                self.callback(err, JSON.parse(stdout));
            });
        },
        'and have suite name': function(json) {
            assert.equal(json.name, 'Suite Bad');
        },
        'and should have 5 passing tests': function(json) {
            assert.equal(json.passed, 5);
        },
        'and should have 5 failing tests': function(json) {
            assert.equal(json.failed, 5);
        }
    },
    'should handle errors': {
        topic: function() {
            var self = this;
            runTest('./html/error.html', function(err, stdout) {
                self.callback(null, JSON.parse(stdout));
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
    'should handle timeouts': {
        topic: function() {
            var self = this;
            runTest('./html/timeout.html', 1, function(err, stdout) {
                self.callback(null, JSON.parse(stdout));
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
    },
    'should parse lcov data': {
        topic: function() {
            cover.set(coverageData);
            var report = cover.getCoverageReport({
                sourceFilePrefix: __dirname
            });
            return report;
        },
        'should be the same': function(topic) {
            assert.equal(coverageFile, topic, 'Failed to produce correct lcov report.');
        }
    }
};

vows.describe('grover').addBatch(tests).export(module);
