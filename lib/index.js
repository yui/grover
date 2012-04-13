require('colors');

module.exports = {
    error: function(str) {
        console.error(str.red);
    },
    log: function(str) {
        console.log(str.bold.blue);
    },
    status: function(json) {
        var str = (json.failed ? ':('.bold.red : ':)'.bold.green) + 
            ' ' + ('[' + json.name + ']').bold.blue +
            ' Passed: ' + (json.passed ? (''+json.passed).green : json.passed) +
            ' Failed: ' + (json.failed ? (''+json.failed).red : json.failed) +
            ' Total: ' +  json.total +
            ' (ignored ' + json.ignored + ')';
        console.log(str);
        
        if (json.failed) {
            Object.keys(json).forEach(function(key) {
                if (typeof json[key] === 'object') {
                    for (var i in json[key]) {
                        if (json[key][i].result === 'fail') {
                            var res = json[key][i];
                            console.log('    ' + ('Failed! ' + res.name).red.bold);
                            console.log('    ' + res.message);
                        }
                    }
                }
            });
        }
        
    }
}
