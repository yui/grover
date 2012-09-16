require('colors');
var cover = require('./coverage');

var good = "✔",
    bad = "✖",
    i,
    timer = function(start, end) {
        var total = end - start,
            diff = {}, str = '';

        diff.seconds_raw = (total/1000);

        diff.days = Math.floor(total/1000/60/60/24);
        total -= diff.days*1000*60*60*24;

        diff.hours = Math.floor(total/1000/60/60);
        total -= diff.hours*1000*60*60;

        diff.minutes = Math.floor(total/1000/60);
        total -= diff.minutes*1000*60;

        diff.seconds = Math.floor(total/1000);

        if (diff.hours) {
            str = diff.hours + ' hours, ' + diff.minutes + ' minutes, ' + diff.seconds + ' seconds';
        } else if (diff.minutes) {
            str = diff.minutes + ' minutes, ' + diff.seconds + ' seconds';
        } else {
            str = diff.seconds_raw + ' seconds';
        }

        return str;
    },
    printFail = function(name, message) {
        console.log('    ' + (name).red.bold);
        var m = message.split('\n');
        m.forEach(function(line) {
            console.log(('       ' + line).red.bold);
        });
    };

if (process.platform === 'win32') {
    good = 'OK';
    bad = 'X';
}


var mods = {
    good: good,
    bad: bad,
    canPrint: function(options, json) {
        json = json || {};
        var p = true;
        if (options.quiet) {
            p = false;
            if (json.failed) {
                p = true;
            }
        }
        if (options.silent) {
            p = false;
        }
        return p;
    },
    error: function(str) {
        console.error(str.red);
    },
    log: function(str) {
        console.log(str.bold.blue);
    },
    status: function(json, start, end) {
        var str;
        /*
        if (json.coverage) {
            showCoverage = true;
            coverage = json.coverage;
            cov = {
                lines: 0,
                hit: 0,
                miss: 0,
                percent: 0
            };
            for (i in coverage) {
                cov.lines = cov.lines + coverage[i].coveredLines;
                cov.miss = cov.miss + (coverage[i].coveredLines - coverage[i].calledLines);
                cov.hit = cov.hit + coverage[i].calledLines;
            }
            cov.percent = Math.floor((cov.hit / cov.lines) * 100);
        }
        */

        str = (json.failed ? bad.bold.red : good.bold.green) + 
            ' ' + ('[' + json.name + ']:').bold[(json.failed ? 'red' : 'blue')] +
            ' Passed: ' + (json.passed ? String(json.passed).green : json.passed) +
            ' Failed: ' + (json.failed ? String(json.failed).red : json.failed) +
            ' Total: ' +  json.total +
            (' (ignored ' + json.ignored + ')').grey;

        if (json.coverage) {
            str += cover.status(json.coverage);
            //str += (' ' + cov.percent + '%').blue + ' ' + (String(cov.hit).green + '/' + String(cov.miss).red + '/' + cov.lines).green;
            //str += (' ' + cov.percent + '%').blue;
        }

        console.log(str);
        
        if (json.failed) {
            if (json.error) {
                printFail('Javascript Error', json.error);
            } else {
                Object.keys(json).forEach(function(key) {
                    var i, t, res;
                    if (typeof json[key] === 'object') {
                        for (i in json[key]) {
                            if (json[key][i].failed) {
                                for (t in json[key][i]) {
                                    if (json[key][i][t].result === 'fail') {
                                        res = json[key][i][t];
                                        printFail(res.name, res.message);
                                    }
                                }
                            } else {
                                if (json[key][i].result === 'fail') {
                                    res = json[key][i];
                                    printFail(res.name, res.message);
                                }
                            }
                        }
                    }
                });
            }
        }

        if (start && end) {
            exports.log('  [Timer] ' + timer(start, end));
        }
        
    }
};

for (i in mods) {
    if (mods.hasOwnProperty(i)) {
        exports[i] = mods[i];
    }
}
