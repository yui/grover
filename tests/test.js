#!/usr/bin/env node

process.chdir(__dirname);

var YUITest = require('yuitest'),
    path = require('path'),
    exec = require('child_process').exec;



var timer = setTimeout(function() {
    console.error('Test Timeout Exiting..');
    process.exit(1);
}, (45 * 1000)); //second test timout

YUITest.TestRunner.subscribe('complete', function() {
    clearTimeout(timer);
});

var Assert = YUITest.Assert;

var wrapper = path.join(__dirname, '../lib/wrapper.js');

var runTest = function(file, timeout, cb) {
    if (!cb) {
        cb = timeout;
        timeout = '';
    }
    var cmd = 'phantomjs ' + wrapper + ' ' + path.join(__dirname, file) + ' ' + timeout;
    //console.log('Executing: ', cmd);
    exec(cmd, cb);
};

var suite = new YUITest.TestSuite('Grover');

suite.add(new YUITest.TestCase({
    name: 'Good Results',
    'Check Results': function() {
        var test = this;
        
        runTest('./html/good.html', function(err, stdout, stderr) {
            test.resume(function() {
                var json = JSON.parse(stdout);
                Assert.areSame('Suite #1', json.name, 'Suite Name Incorrect');
                Assert.areEqual(50, json.passed, 'A test failed');
                Assert.areEqual(0, json.failed, 'A test failed');
            });
        });

        this.wait();
    }
}));

suite.add(new YUITest.TestCase({
    name: 'Failed Results',
    'Failed Tests': function() {
        var test = this;
        
        runTest('./html/bad.html', function(err, stdout) {
            test.resume(function() {
                var json = JSON.parse(stdout);
                Assert.areSame('Suite Bad', json.name, 'Suite Name Incorrect');
                Assert.areEqual(5, json.passed, 'A test failed');
                Assert.areEqual(5, json.failed, 'A test failed');
            });
        });

        this.wait();
    }
}));

suite.add(new YUITest.TestCase({
    name: 'Errors',
    'Should throw script error': function() {
        var test = this;
        
        runTest('./html/error.html', function(err, stdout) {
            test.resume(function() {
                var json = JSON.parse(stdout);
                Assert.areEqual(0, json.passed, 'A test failed');
                Assert.areEqual(1, json.failed, 'A test failed');
                Assert.isNotUndefined(json.error, 'Error message was not passed along');
            });
        });

        this.wait();
    },
    'Should Throw Timeout': function() {
        var test = this;
        
        runTest('./html/timeout.html', 1, function(err, stdout) {
            test.resume(function() {
                var json = JSON.parse(stdout);
                Assert.areEqual(0, json.passed, 'A test failed');
                Assert.areEqual(1, json.failed, 'A test failed');
                Assert.isNotUndefined(json.error, 'Error message was not passed along');
                Assert.areEqual('Script Timeout', json.error);
            });
        });

        this.wait();
    }
}));

var parse = require(path.join(__dirname, '../lib/options')).parse;

suite.add(new YUITest.TestCase({
    name: 'Options Tests',
    'check timeout number': function() {
        var opts = parse(['-t', '3']);
        Assert.areEqual(3, opts.timeout, 'Failed to set number timeout');

        opts = parse(['--timeout', '3']);
        Assert.areEqual(3, opts.timeout, 'Failed to set number timeout');
    },
    'check timeout -1': function() {
        var opts = parse(['-t', '-1']);
        Assert.isNull(opts.timeout, 'Failed to set null timeout');

        opts = parse(['--timeout', '-1']);
        Assert.isNull(opts.timeout, 'Failed to set null timeout');
    },
    'check timeout string': function() {
        var opts = parse(['-t', 'foobar']);
        Assert.isUndefined(opts.timeout, 'Failed to set null timeout');

        opts = parse(['--timeout', 'foobar']);
        Assert.isUndefined(opts.timeout, 'Failed to set null timeout');
    },
    'check booleans': function() {
        var opts = parse(['-s', '-q', '-f']);
        Assert.isTrue(opts.silent, 'Failed to set silent');
        Assert.isTrue(opts.quiet, 'Failed to set quiet');
        Assert.isTrue(opts.exitOnFail, 'Failed to set exitOnFail');

        opts = parse(['--quiet', '--silent', '--fail']);
        Assert.isTrue(opts.silent, 'Failed to set silent');
        Assert.isTrue(opts.quiet, 'Failed to set quiet');
        Assert.isTrue(opts.exitOnFail, 'Failed to set exitOnFail');
    }
}));


YUITest.TestRunner.add(suite);

