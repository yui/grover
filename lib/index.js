var color = require('ansi-color').set;
var cover = require('./coverage');
//Moved to another file so it's easy to edit on windows.
var chars = require('./chars');
var timethat = require('timethat');

var log = require('./log');

var good = chars.good,
    bad = chars.bad,
    i,
    mods,
    hasColor = process.stdout.isTTY,
    path = require('path'),
    fs = require('fs'),
    printFail = function(name, message) {
        message = message.replace(/%5C/g, '\\');
        log.log('    ' + mods.color(name, 'red+bold'));
        var m = message.split('\n');
        m.forEach(function(line) {
            log.log('       ' + mods.color(line, 'red+bold'));
        });
    };



mods = {
    init: function(options) {
        if (options.color === false || !process.stdout.isTTY) {
            hasColor = false;
        }
    },
    exists: fs.exists || path.exists,
    existsSync: fs.existsSync || path.existsSync,
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
        options = options || {};
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
        log.error(mods.color(str, 'red'));
    },
    log: function(str) {
        log.log(mods.color(str, 'bold+blue'));
    },
    status: function(json, start, end) {
        var str = (json.failed ? mods.color(bad, 'bold+red') : mods.color(good, 'bold+green')) +
            ' ' + mods.color('[' + json.name + ']:', (json.failed ? 'red' : 'blue') + '+bold') +
            ' Passed: ' + (json.passed ? mods.color(String(json.passed), 'green+bold') : json.passed) +
            ' Failed: ' + (json.failed ? mods.color(String(json.failed), 'red+bold') : json.failed) +
            ' Total: ' +  json.total +
            mods.color(' (ignored ' + json.ignored + ')', 'white'),
            s = (new Date()).getTime(),
            e = s + json.duration;

        if (json.duration) {
            str += ' (' + timethat.calc(s, e) + ')';
        }


        if (json.coverage) {
            str += cover.status(json.coverage);
        }

        if (json.consoleInfo && json.consoleInfo.length) {
            str += '\n';
            json.consoleInfo.forEach(function(line) {
                str += '    ' + mods.color(line.type + ': ', 'white') + line['arguments'].join(', ') + '\n';
            });
        }

        log.log(str);

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
            exports.log('  [Grover Execution Timer] ' + timethat.calc(start, end));
        }

    },
    exit: function(code) {
        process.exit(code);
    }
};

for (i in mods) {
    if (mods.hasOwnProperty(i)) {
        exports[i] = mods[i];
    }
}
