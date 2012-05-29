/*
Wrapper for PhantomJS and YUITest
*/

/*
TODO --
onError: Handle JS errors and throw a YUITest error
Timeout: Specify a timeout (override too) to kill a test
*/

var injectGetYUITest = function() {
    window.TestResults = null;
    window.getYUITest = function() {
        return window.YUITest;
    };

    window.getYUITestResults = function() {
        if (window.TestResults) {
            return window.TestResults;
        }
        var YUITest = window.getYUITest();
        if (YUITest) {
            var json = YUITest.Runner.getResults(YUITest.Format.JSON);
            if (window._$jscoverage && json) {
                json = JSON.parse(json);
                json.jscoverage = window._$jscoverage;
                json = JSON.stringify(json);
            }
            //console.log('Found YUITest, checking results');
            //console.log(json);
            return json;
        }
    };

};

var testTimer;

var startTest = function(page, cb) {
    //console.log('Checking for YUITest');
    testTimer = setInterval(function() {
        //console.log('Checking..');
        var status = page.evaluate(function() {
            var t = window.getYUITest();
            return (t ? true : false);
        });
        //console.log('Tester: ', status);
        if (status) {
            clearInterval(testTimer);
            cb(status);
        }
    }, 50);
};

var throwError = function(msg) {
    var json = {
        passed: 0,
        failed: 1,
        total: 1,
        ignored: 0,
        name: file,
        error: msg
    };
    console.log(JSON.stringify(json));
    phantom.exit(1);
};

var waitTimer,
    waitCounter = 0;

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

        if (waitCounter > 20) {
            //clearInterval(waitTimer);
            //cb(null);
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
        //TODO
        //Load this into a YUITest result to fail the test
        /*
        console.log('Error: ', msg);
        trace.forEach(function(item) {
            console.log('  ', item.file, ':', item.line);
        });
        */
        throwError(msg);

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


var filterCoverage = function(cov) {
    var d = {
        lines: 0,
        miss: 0,
        hit: 0,
        percent: 0
    };

    cov.forEach(function(res) {
        if (res !== null) {
            d.lines++;
            if (res) {
                d.hit++;
            } else {
                d.miss++;
            }
        }
    });

    d.percent = Math.floor((d.hit / d.lines) * 100);

    return d;
};

var mergeCoverage = function(report) {
    var out = {},
        data = {};

    for (var file in report) {
        if (!out[file]) {
            out[file] = [];
        }
        report[file].forEach(function(v, k) {
            if (!out[file][k]) {
                out[file][k] = v;
            }
        });
    }
    for (var i in out) {
        if (i.indexOf('-min.js') === -1) { // Ignore minified files, they don't cover well
            var filtered = filterCoverage(out[i]);
            if (filtered && filtered.lines > 3) { //Catch parse errors and only cover files with more than 3 lines of code (probably minned)
                data[i] = filtered;
            }
        }
    }
    return data;
};


if (!phantom.args.length) {
    console.log('Please provide some test files to execute');
    phantom.exit(1);
}

var file = phantom.args[0];
var timeout = parseInt(phantom.args[1]);
var timer;

if (isNaN(timeout)) {
    timeout = 60; //Default to one minute before failing the test
}
timer = setTimeout(function() {
    throwError('Script Timeout');
}, (timeout * 1000));

var fs = require('fs');

var filterName = function(str) {
    return str.replace(/ /g, '_').replace(/\//g, '_');
}

executeTest(file, function(page, results) {
    results = JSON.parse(results);
    if (results.jscoverage) {
        results.jscoverage = mergeCoverage(results.jscoverage);
    }
    results = JSON.stringify(results);
    console.log(results);
    phantom.exit();
});
