var YUITest = require('yuitest');

module.exports = function(results, type) {
    var format = 'TAP';
    if (type) {
        if (YUITest.TestFormat[type]) {
            format = type;
        }
    }
    var data = {};
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

    /*
    I know this is bad, but YUITest.TestRunner doesn't allow
    me to add results in a public way, so I have to "work around" it :)
    */
    YUITest.TestRunner._lastResults = data;

    return YUITest.TestRunner.getResults(YUITest.TestFormat[type]);
};

