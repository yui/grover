/**
Wrapper for PhantomJS and YUITest
*/

var injectGetYUITest = function() {
    window.TestResults = null;
    window.getYUITest = function() {
        if (window.YUITest && window.YUITest._patched) {
            return window.YUITest;
        }

        //This catches standalone YUITest 
        // and Y.Test from a YUI instance
        var YUITest = window.YUITest;
        if (!YUITest) {
            YUI().use('test', function(Y) {
                YUITest = Y.Test;
            });
        }

        if (YUITest) {
            if (!YUITest.Runner) {
                YUITest.Runner = YUITest.TestRunner;
            }
            YUITest._patched = true;
        }
        window.YUITest = YUITest;
        return YUITest;
    }
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

var addResultListener = function() {

    var YUITest = window.getYUITest();

    YUITest.Runner.subscribe(YUITest.Runner.COMPLETE_EVENT, function() {
        var results = {
            js: YUITest.Runner.getResults(), // JS object
            tap: YUITest.Runner.getResults(YUITest.Format.TAP), // plain text
            json: YUITest.Runner.getResults(YUITest.Format.JSON), // JSON String
            junit: YUITest.Runner.getResults(YUITest.Format.JUnitXML), // Single JUnit file
            xml: YUITest.Runner.getResults(YUITest.Format.XML), // Single XML file
        };
        window.TestResults = results;
    });
 
};

var waitTimer;

var waitForResults = function(page, cb) {

    waitTimer = setInterval(function() {
        //console.log('Waiting on Results');
        var status = page.evaluate(function() {
            return window.TestResults;
        });
        if (status) {
            clearInterval(waitTimer);
            //console.log('Found Results');
            cb(status);
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
    }

    page.onConsoleMessage = function(msg) {
        //console.log('[console.log]', msg);
    };
    page.onAlert = function(msg) {
        //console.log('[window.alert]', msg);
    };


    //console.log('Opening File', file);
    page.open(file, function(status) {
        //console.log('Status: ', status);
        //console.log('Injecting getYUITest');
        page.evaluate(injectGetYUITest);

        startTest(page, function() {
            //console.log('YUITest Found..');
            page.evaluate(addResultListener);
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

var file = phantom.args[1];
var dir = phantom.args[0];

var fs = require('fs');

var filterName = function(str) {
    return str.replace(/ /g, '_').replace(/\//g, '_');
}

executeTest(file, function(page, results) {
    //Save the results for the nodejs processor
    if (dir !== 'false') {
        var json = JSON.parse(results.json);
        var d = dir + '/' + filterName(json.name);
        fs.makeDirectory(d);
        var ss = d + '/screenshot.png';
        page.render(ss);
        var res = d + '/results.json';
        fs.write(res, JSON.stringify(results), 'w');
    }
    console.log(JSON.stringify(results));
    phantom.exit();
});
