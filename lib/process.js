var YUITest = require('yuitest');

module.exports = function(results, type) {
    var data = {},
        str = '';

    results.forEach(function(r) {
        Object.keys(r).forEach(function(key) {
            if (!data[key]) {
                data[key] = r[key];
            }
            if (data[key] && (typeof data[key] === 'number')) {
                data[key] += r[key];
            }
        });
    });

    if (Array.isArray(results) && results.length === 1) {
        data = results[0];
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

