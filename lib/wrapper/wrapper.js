/*
Wrapper for PhantomJS and YUITest
*/

/*jslint browser: true */
/*global phantom */

/*
TODO --
onError: Handle JS errors and throw a YUITest error
Timeout: Specify a timeout (override too) to kill a test
*/
var waitTimer,
    waitCounter = 0,
    testTimer,
    fs = require('fs'),
    file = phantom.args[0],
    timeout = parseInt(phantom.args[1], 10),
    timer,
    filterName = function(str) {
        return str.replace(/ /g, '_').replace(/\//g, '_');
    };

var injectGetYUITest = function() {
    window.TestResults = null;
    window.getYUITest = function() {
        return window.YUITest;
    };

    window.getYUITestResults = function() {
        if (window.TestResults) {
            return window.TestResults;
        }
        var YUITest = window.getYUITest(), json, cover;
        if (YUITest) {
            json = YUITest.Runner.getResults(YUITest.Format.JSON);
            cover = YUITest.Runner.getCoverage();

            if (json && cover) {
                json = JSON.parse(json);
                json.coverage = cover;
                json = JSON.stringify(json);
                
            }
            if (json && window.__coverage__) {
                json = JSON.parse(json);
                json.coverageType = 'istanbul';
                json.coverage = window.__coverage__;
                json = JSON.stringify(json);
            }
            //console.log('Found YUITest, checking results');
            //console.log(json);
            return json;
        }
    };

};
var startTest = function(page, cb) {
    //console.log('Checking for YUITest');
    testTimer = setInterval(function() {
        //console.log('Checking..');
        var status = page.evaluate(function() {
            var t = window.getYUITest();
            if (t) {
                for (var i in t) {
                    var name = i.replace('Test', '');
                    t[name] = t[i];
                }
            }
            return (t ? true : false);
        });
        //console.log('Tester: ', status);
        if (status) {
            clearInterval(testTimer);
            cb(status);
        }
    }, 50);
};

var throwError = function(msg, trace) {
    var json = {
        passed: 0,
        failed: 1,
        total: 1,
        ignored: 0,
        name: file,
        error: msg
    };
    if (trace) {
        trace.forEach(function(item) {
            json.error += '\n' + item.file +  ':' + item.line;
        });
    }
    console.log(JSON.stringify(json));
    phantom.exit(1);
};

var waitForResults = function(page, cb) {

    waitTimer = setInterval(function() {
        waitCounter++;
        //console.log('Waiting on Results', waitCounter);
        var status = page.evaluate(function() {
            return window.getYUITestResults();
        });
        if (status) {
            clearInterval(waitTimer);
            //console.log('Found Results');
            cb(status);
            return;
        }

    }, 150);

};

var executeTest = function(file, cb) {

    var page = require('webpage').create();

    page.settings.javascriptEnabled = true;
    page.settings.localToRemoteUrlAccessEnabled = true;
    page.settings.loadImages = true;
    page.settings.loadPlugins = true;
    page.viewportSize = {
      width: 1024,
      height: 768
    };

    page.onConsoleMessage = function(msg) {
        //console.log('[console.log]', msg);
    };
    page.onAlert = function(msg) {
        //console.log('[window.alert]', msg);
    };
    page.onError = function(msg, trace) {
        throwError(msg, trace);

    };


    //console.log('Opening File', file);
    page.open(file, function(status) {
        if (status === 'fail') {
            throwError('Phantom failed to load this page');
        }
        //console.log('Status: ', status);
        //console.log('Injecting getYUITest');
        page.evaluate(injectGetYUITest);

        startTest(page, function() {
            //console.log('YUITest Found..');
            waitForResults(page, function(results) {
                //console.log('YUITest Results Returned');
                cb(page, results);
            });
        });
    });
};


if (!phantom.args.length) {
    console.log('Please provide some test files to execute');
    phantom.exit(1);
}

if (isNaN(timeout)) {
    timeout = 60; //Default to one minute before failing the test
}
timer = setTimeout(function() {
    throwError('Script Timeout');
}, (timeout * 1000));


executeTest(file, function(page, results) {
    console.log(results);
    phantom.exit();
});
