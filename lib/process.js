var YUITest = require('yuitest');

module.exports = function(results, type) {
    var data = {},
        str = '',
        handle = function(r) {
            Object.keys(r).forEach(function(key) {
                if (!data[key]) {
                    data[key] = r[key];
                }
                if (data[key] && (typeof data[key] === 'number')) {
                    data[key] += r[key];
                }
            });
        };

    if (Array.isArray(results) && results.length === 1) {
        handle(results[0]);
    } else {
        results.forEach(function(d, index) {
            if (index === 0) {
                handle(d);
            } else {
                var name = d.name;
                data[name] = data[name] || {};
                Object.keys(d).forEach(function(key) {
                    if (!data[name][key]) {
                        data[name][key] = d[key];
                    }
                    if (data[name][key] && (typeof data[name][key] === 'number')) {
                        data[name][key] += d[key];
                    }
                });
            }
        });
    }

    //Fixes #9 - YUITest knows nothing about Istanbul data, so we need to remove it first
    if (data.coverage && data.coverageType && data.coverageType === 'istanbul' && type !== 'JSON') {
        delete data.coverage;
    }

    /*
    I know this is bad, but YUITest.TestRunner doesn't allow
    me to add results in a public way, so I have to "work around" it :)
    */
    YUITest.TestRunner._lastResults = data;

    str = YUITest.TestRunner.getResults(YUITest.TestFormat[type]);
    if (type === 'JSON') {
        str = JSON.stringify(JSON.parse(str), null, 4) + '\n';
    }
    return str;
};

