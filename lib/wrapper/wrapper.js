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
    file = phantom.args[0],
    timeout = parseInt(phantom.args[1], 10),
    timer,
    debug = false,
    log = function(a, b) {
        b = (typeof b === 'undefined') ? '' : b;
        if (debug) {
            console.log(a, b);
        }
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
            return json;
        }
    };

};
var startTest = function(page, cb) {
    log('Checking for YUITest');
    testTimer = setInterval(function() {
        //console.log('Checking..');
        var status = page.evaluate(function() {
            var t = window.getYUITest(),
                i, name;
            if (t) {
                for (i in t) {
                    name = i.replace('Test', '');
                    t[name] = t[i];
                }
            }
            return (t ? true : false);
        });
        log('Tester: ', status);
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
        log('Waiting on Results', waitCounter);
        var status = page.evaluate(function() {
            return window.getYUITestResults();
        });
        if (status) {
            clearInterval(waitTimer);
            log('Found Results');
            cb(status);
            return;
        }

    }, 150);

};

var executeTest = function(file, cb) {
    log('executing tests in ', file);
    var page = require('webpage').create(),
        opened = false;

    page.settings.javascriptEnabled = true;
    page.settings.localToRemoteUrlAccessEnabled = true;
    page.settings.loadImages = true;
    page.settings.loadPlugins = true;
    page.viewportSize = {
      width: 1024,
      height: 768
    };

    page.onConsoleMessage = function() {
        //console.log('[console.log]', msg);
    };
    page.onAlert = function() {
        //console.log('[window.alert]', msg);
    };
    page.onError = function(msg, trace) {
        throwError(msg, trace);
    };

    if (!opened) {
        log('Opening File', file, opened);
        page.open(file, function(status) {
            log('Opened File', file);
            if (opened) {
                return;
            }
            if (status === 'fail') {
                throwError('Phantom failed to load this page');
            }
            log('Status: ', status);
            log('Injecting getYUITest');
            page.evaluate(injectGetYUITest);

            startTest(page, function() {
                log('YUITest Found..');
                waitForResults(page, function(results) {
                    log('YUITest Results Returned');
                    cb(page, results);
                });
            });
            opened = true;
        });
    }
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
