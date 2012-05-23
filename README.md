YUITest Wrapper for PhantomJS
=============================

A little command line tool for running [YUITest](http://yuilibrary.com/yuitest) html
files inside of PhantomJS.

This release supports exiting with the proper exit code to fail a build.

Installation
------------

You must have the `phantomjs` command line tool installed prior to running this.

    npm -g install grover

Build Status
------------

[![Travis Build Status](https://secure.travis-ci.org/davglass/grover.png?branch=master)](http://travis-ci.org/davglass/grover)

Output
------

    grover app/tests/app.html yui/tests/index.html loader/tests/index.html editor/tests/editor.html
    Starting Grover on 4 files with PhantomJS@1.5.0
      Running 15 concurrent tests at a time.
    ✔ [Loader Automated Tests]: Passed: 60 Failed: 0 Total: 60 (ignored 0)
    ✔ [App Framework]: Passed: 269 Failed: 0 Total: 269 (ignored 0)
    ✔ [Editor]: Passed: 31 Failed: 0 Total: 31 (ignored 0)
    ✔ [YUI Core Test Suite]: Passed: 50 Failed: 0 Total: 51 (ignored 1)
    ----------------------------------------------------------------
    ✔ [Total]: Passed: 410 Failed: 0 Total: 411 (ignored 1)
      [Timer] 8.928 seconds


Commandline Arguments
---------------------

    grover <paths to yuitest html files>
       -v, --version Print version
       -h, --help Print this stuff
       -s, --silent Print no output, only use exit code
       -q, --quiet Only print errors and use exit code
       -f, --fail Fail on first error
       -c, --concurrent Number of tests to run concurrently, default: 15
       -t, --timeout Specify a timeout (in seconds) for a test file to be considered as failed.
       -i, --import <path to js file> - Require this file and use the exports (array)
               as the list of files to process.
       -p, --prefix <string> String to prefix to all urls (for dynamic server names)
       -o, --outfile <path to export file>
           You can specify an export type with the following:
           --tap TAP export (default)
           --xml XML export
           --json JSON export
           --junit JUnit XML export

Saving Results
--------------

Grover supports the 4 ways that YUITest exports it's tests results so you can import them
into another system.

    grover ./tests/*.js -o ./results/results.json --json
    grover ./tests/*.js -o ./results/results.xml --xml
    grover ./tests/*.js -o ./results/results.tap --tap
    grover ./tests/*.js -o ./results/results.junit.xml --junit



What's with the name?
---------------------

This tool is dedicated to [Ryan Grove](https://github.com/rgrove) for all his work on YUI over the last year.
I told him that my next command line tool would be named "grover" after "rgrove".
