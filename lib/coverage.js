var istanbul = require('istanbul');
var Table = require('cli-table');
var util = require('../lib/index');
var fs = require('fs');
var path = require('path');
var existsSync = fs.existsSync || path.existsSync;
var coverageInfo = {};
var coverageType = 'yuitest';

var options;

exports.options = function(o) {
    options = o;
};

var isIstanbul = function(json) {
    var first = Object.keys(json)[0],
        ret = false;

    if (json[first].s !== undefined && json[first].fnMap !== undefined) {
        ret = true;
    }

    if (json.s !== undefined && json.fnMap !== undefined) {
        ret = true;
    }
    if (ret) {
        coverageType = 'istanbul';
    }
    return ret;
};

var set = function(json) {
    var d = {}, i;

    for (i in json) {
        d[i] = json[i];
        delete d[i].code;
    }

    if (isIstanbul(json)) {
        if (!Array.isArray(coverageInfo)) {
            coverageInfo = [];
        }
        coverageInfo.push(json);
    } else {
        for (i in json) {
            if (json[i].coveredLines !== undefined) { //YUITest
                coverageInfo[i] = coverageInfo[i] || {};
                coverageInfo[i].path = i;
                /*jshint loopfunc: true */
                ['calledLines', 'calledFunctions', 'coveredLines', 'coveredFunctions'].forEach(function(prop) {
                    coverageInfo[i][prop] = coverageInfo[i][prop] || 0;
                    coverageInfo[i][prop] = Math.max(coverageInfo[i][prop], json[i][prop], 0);
                });
            }
        }
    }
};

exports.set = set;

var printYUITestReport = function() {
    var items = [],
        table = new Table({
            head: ['path', 'lines', '%', 'functions', '%' ],
            colAligns: [ 'left', 'center', 'right', 'center', 'right'  ],
            style: {
                'padding-left': 2,
                'padding-right': 2,
                head: ['blue']
            }
        }),
        totals = {
            coveredLines: 0,
            coveredFunctions: 0,
            calledLines: 0,
            calledFunctions: 0
        };
    Object.keys(coverageInfo).forEach(function(item) {
        items.push(coverageInfo[item]);
    });

    items.sort(function(a, b) {
        if (!a.path || !b.path) {
            return 0;
        }
        var an = a.path.toLowerCase(),
            bn = b.path.toLowerCase(),
            ret = 0;

        if (an < bn) {
            ret = -1;
        }
        if (an > bn) {
            ret =  1;
        }
        return ret;
    });

    items.forEach(function(row) {
        var err,
            percentLine = Math.floor((row.calledLines / row.coveredLines) * 100),
            percentFunction = Math.floor((row.calledFunctions / row.coveredFunctions) * 100),
            cell = [
                row.path,
                row.calledLines + '/' + row.coveredLines,
                percentLine + '%',
                row.calledFunctions + '/' + row.coveredFunctions,
                percentFunction + '%'
            ];

            ['calledLines', 'calledFunctions', 'coveredLines', 'coveredFunctions'].forEach(function(prop) {
                totals[prop] += row[prop];
            });

        if (percentLine <= options.coverageWarn) {
            err = true;
            cell[1] = util.color(String(cell[1]), 'red');
            cell[2] = util.color(String(cell[2]), 'red');
        }
        if (percentFunction <= options.coverageWarn) {
            err = true;
            cell[3] = util.color(String(cell[3]), 'red');
            cell[4] = util.color(String(cell[4]), 'red');
        }
        if (err) {
            cell[0] = util.color(util.bad, 'red') + ' ' + cell[0];
        } else {
            cell[0] = util.color(util.good, 'green') + ' ' + cell[0];
        }
        table.push(cell);
    });

    table.push([
        'total',
        totals.calledLines + '/' + totals.coveredLines,
        Math.floor((totals.calledLines / totals.coveredLines) * 100) + '%',
        totals.calledFunctions + '/' + totals.coveredFunctions,
        Math.floor((totals.calledFunctions / totals.coveredFunctions) * 100) + '%'
    ]);
    console.log(table.toString());
};

var printIstanbulReport = function() {
    var collect = new istanbul.Collector(),
        table = new Table({
            head: ['path', 'lines', '%', 'statements', '%', 'functions', '%', 'branches', '%' ],
            colAligns: [ 'left', 'center', 'right', 'center', 'right', 'center', 'right', 'center', 'right'  ],
            style: {
                'padding-left': 2,
                'padding-right': 2,
                head: ['blue']
            }
        });

    coverageInfo.forEach(function(coverage) {
        collect.add(coverage);
    });

    collect.files().sort().forEach(function(file) {
        var err = false,
            fileCoverage = collect.fileCoverageFor(file),
            row = istanbul.utils.summarizeFileCoverage(fileCoverage),
            cell = [
                file,
                row.lines.covered + '/' + row.lines.total,
                row.lines.pct + '%',
                row.statements.covered + '/' + row.statements.total,
                row.statements.pct + '%',
                row.functions.covered + '/' + row.functions.total,
                row.functions.pct + '%',
                row.branches.covered + '/' + row.branches.total,
                row.branches.pct + '%'
            ];

        if (row.lines.pct <= options.coverageWarn) {
            err = true;
            cell[1] = util.color(String(cell[1]), 'red');
            cell[2] = util.color(String(cell[2]), 'red');
        }
        if (row.statements.pct <= options.coverageWarn) {
            err = true;
            cell[3] = util.color(String(cell[3]), 'red');
            cell[4] = util.color(String(cell[4]), 'red');
        }
        if (row.functions.pct <= options.coverageWarn) {
            err = true;
            cell[5] = util.color(String(cell[5]), 'red');
            cell[6] = util.color(String(cell[6]), 'red');
        }
        if (row.branches.pct <= options.coverageWarn) {
            err = true;
            cell[7] = util.color(String(cell[7]), 'red');
            cell[8] = util.color(String(cell[8]), 'red');
        }
        if (err) {
            cell[0] = util.color(util.bad, 'red') + ' ' + cell[0];
        } else {
            cell[0] = util.color(util.good, 'green') + ' ' + cell[0];
        }
        table.push(cell);
    });
    console.log(table.toString());
};

var report = function() {
    if (coverageType === 'istanbul') {
        printIstanbulReport();
    } else {
        printYUITestReport();
    }
};

exports.report = report;


var getYUIStatus = function(coverage) {
    var cov = {
        lines: 0,
        hit: 0,
        miss: 0,
        percent: 0
    }, i, str;
    for (i in coverage) {
        cov.lines = cov.lines + coverage[i].coveredLines;
        cov.miss = cov.miss + (coverage[i].coveredLines - coverage[i].calledLines);
        cov.hit = cov.hit + coverage[i].calledLines;
    }
    cov.percent = Math.floor((cov.hit / cov.lines) * 100);

    str = util.color(' ' + cov.percent + '%', 'blue');
    return str;
};

var getIstanbulStatus = function(coverage) {
    var collect = new istanbul.Collector(),
        lines = [],
        str = '',
        pct = 0;

    collect.add(coverage);
    collect.files().forEach(function(file) {
        var fileCoverage = collect.fileCoverageFor(file),
            summary = istanbul.utils.summarizeFileCoverage(fileCoverage);
        lines.push(summary.lines.pct);
        pct += summary.lines.pct;
    });

    str = util.color(' ' + Math.floor(pct / lines.length) + '%', 'blue');
    return str;
};

exports.status = function(json) {
    var out;
    if (isIstanbul(json)) {
        coverageType = 'istanbul';
        out = getIstanbulStatus(json);
    } else {
        out = getYUIStatus(json);
    }
    return out;
};

var getIstanbulCoverageReport = function (json) {
    var report = {coverage: json.coverage};
    //istanbul implementation
    return report;
};

exports.getIstanbulCoverageReport = getIstanbulCoverageReport;

var getYUITestCoverage = function (testName, prefix, coverage) {
    var lcovreport = {},
        iter = 0,
        keys = Object.keys(coverage),
        file,
        data,
        match,
        name,
        line,
        exec,
        fn,
        fnkeys,
        lineKeys,
        j = 0;

    for (iter; iter < keys.length; iter += 1) {
        file = keys[iter];
        data = coverage[file];
        lcovreport.TN = testName;
        lcovreport.SF = prefix ? prefix + path.basename(file) : path.relative(file) + "/" + file;
        lcovreport.DA = [];
        lcovreport.FN = [];
        lcovreport.FNDA = [];
        lcovreport.FNF = data.coveredFunctions;
        lcovreport.FNH = data.calledFunctions;
        lcovreport.LF = data.coveredLines;
        lcovreport.LH = data.calledLines;

        fnkeys = Object.keys(data.functions);
        for (j; j < fnkeys.length; j += 1) {
            fn = fnkeys[j];
            exec = data.functions[fn];
            match = fn.match(/^([\w ()_]+):(\d)+$/);
            name = match[1];
            line = match[2];

            lcovreport.FN.push({name: name, line: line});
            lcovreport.FNDA.push({name: name, exec: exec});
        }

        lineKeys = Object.keys(data.lines);
        for (j = 0; j < lineKeys.length; j += 1) {
            line = lineKeys[j];
            exec = data.lines[line];
            lcovreport.DA.push({line: line, exec: exec});
        }
    }
    return lcovreport;
};
exports.getYUITestCoverage = getYUITestCoverage;

var getYUITestLcovReport = function (report) {
    var text = '',
        i = 0,
        fn,
        line;

    text += "TN:" + report.TN + "\n";
    text += "SF:" + report.SF + "\n";

    for (i; i < report.FN.length; i += 1) {
        fn = report.FN[i];
        text += "FN:" + fn.line + "," + fn.name + "\n";
    }
    text += "\n";

    for (i = 0; i < report.FNDA.length; i += 1) {
        fn = report.FNDA[i];
        text += "FNDA:" + fn.exec + "," + fn.name + "\n";
    }
    text += "\n";

    text += "FNF:" + report.FNF + "\n";
    text += "FNH:" + report.FNH + "\n";

    for (i = 0; i < report.DA.length; i += 1) {
        line = report.DA[i];
        text += "DA:" + line.line + "," + line.exec + "\n";
    }
    text += "\n";
    text += "LF:" + report.LF + "\n";
    text += "LH:" + report.LH + "\n\n";
    text += "end_of_record\n";
    return text;
};
exports.getYUITestLcovReport = getYUITestLcovReport;

var getCoverageReport = function (json, prefix) {
    var out;
    if (isIstanbul(json)) {
        out = getIstanbulCoverageReport(json);
    } else {
        out = getYUITestLcovReport(getYUITestCoverage(json.name, prefix, json.coverage));
    }
    return out;
};
exports.getCoverageReport = getCoverageReport;

var printLcovReport = function (json, options) {
    var filename = options.coverageFileName,
        sourceFilePrefix = options.sourceFilePrefix,
        reportText = getCoverageReport(json, sourceFilePrefix);

    if (filename) {

        if (typeof fs.appendFileSync === "function") {
            //Only available in Node 0.8.x, creates a file if one doesn't exist, appends when one does.
            fs.appendFileSync(filename, reportText, 'utf8');
        } else {
            //Node 0.6.x
            if (existsSync(filename)) {
                reportText = fs.readFileSync(filename) + reportText;
            }
            fs.writeFileSync(filename, reportText, 'utf8');
        }
    }
};

exports.printLcovReport = printLcovReport;
