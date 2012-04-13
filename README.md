YUITest Wrapper for PhantomJS
=============================

A little command line tool for running [http://yuilibrary..com/yuitest](YUITest) html
files inside of PhantomJS.

This release supports exiting with the proper exit code to fail a build.

Installation
------------

You must have the `phantomjs` command line tool installed prior to running this.

    npm -g install grover

Output
------

     grover app/tests/app.html yui/tests/index.html loader/tests/index.html editor/tests/editor.html
     Starting Grover on 4 files with PhantomJS@1.5.0
     :) [App Framework] Passed: 246 Failed: 0 Total: 246 (ignored 0)
     :) [YUI Core Test Suite] Passed: 41 Failed: 0 Total: 42 (ignored 1)
     :) [Loader Automated Tests] Passed: 52 Failed: 0 Total: 52 (ignored 0)
     :( [Editor] Passed: 30 Failed: 1 Total: 31 (ignored 0)
         Failed! test: EditorSelection
             Unexpected error: 'null' is not an object
             ---------------------------------------
             :( [Total] Passed: 369 Failed: 1 Total: 371 (ignored 1)



What's with the name?
---------------------

This tool is dedicated to [https://github.com/rgrove](Ryan Grove) for all his work on YUI over the last year.
I told him that my next command line tool would be named "grover" after "rgrove".
