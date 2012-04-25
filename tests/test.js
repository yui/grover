#!/usr/bin/env node

process.chdir(__dirname);

var YUITest = require('yuitest'),
    path = require('path'),
    exec = require('child_process').exec;



var timer = setTimeout(function() {
    console.error('Test Timeout Exiting..');
    process.exit(1);
}, (30 * 1000)); //30 second test timout

YUITest.TestRunner.subscribe('complete', function() {
    clearTimeout(timer);
});

var Assert = YUITest.Assert;

var wrapper = path.join(__dirname, '../lib/wrapper.js');

var runTest = function(file, cb) {
    var cmd = 'phantomjs ' + wrapper + ' ' + path.join(__dirname, file);
    console.log('Executing: ', cmd);
    exec(cmd, cb);
};

var suite = new YUITest.TestSuite('Grover');

suite.add(new YUITest.TestCase({
    name: 'Good Results',
    'Check Results': function() {
        var test = this;
        
        runTest('./html/good.html', function(err, stdout, stderr) {
            console.log(arguments);
            test.resume(function() {
                var json = JSON.parse(stdout);
                Assert.areSame('Suite #1', json.name, 'Suite Name Incorrect');
                Assert.areEqual(50, json.passed, 'A test failed');
                Assert.areEqual(0, json.failed, 'A test failed');
            });
        });

        this.wait(15000);
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

        this.wait(15000);
    }
}));


YUITest.TestRunner.add(suite);

