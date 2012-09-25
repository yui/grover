var color = require('ansi-color').set;
var cover = require('./coverage');

//Moved to another file so it's easy to edit on windows.
var chars = require('./chars');

var good = chars.good,
    bad = chars.bad,
    i,
    stdio,
    mods,
    hasColor = false,
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
        message = message.replace(/%5C/g, '\\');
        console.log('    ' + mods.color(name, 'red+bold'));
        var m = message.split('\n');
        m.forEach(function(line) {
            console.log('       ' + mods.color(line, 'red+bold'));
        });
    };


try {
    stdio = require("stdio");
    hasColor = stdio.isStderrATTY();
} catch (ex) {
    hasColor = true;
}

mods = {
    color: function (str, code) {
        if (!hasColor) {
            return str;
        }
        return color(str, code);
    },
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
        console.error(mods.color(str, 'red'));
    },
    log: function(str) {
        console.log(mods.color(str, 'bold+blue'));
    },
    status: function(json, start, end) {
        var str = (json.failed ? mods.color(bad, 'bold+red') : mods.color(good, 'bold+green')) + 
            ' ' + mods.color('[' + json.name + ']:', (json.failed ? 'red' : 'blue')) +
            ' Passed: ' + (json.passed ? mods.color(String(json.passed), 'green') : json.passed) +
            ' Failed: ' + (json.failed ? mods.color(String(json.failed), 'red') : json.failed) +
            ' Total: ' +  json.total +
            mods.color(' (ignored ' + json.ignored + ')', 'white');

        if (json.coverage) {
            str += cover.status(json.coverage);
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
