require('colors');

var good = "✔",
    bad = "✖",
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


        //console.log(diff); 
        if (diff.hours) {
            str = diff.hours + ' hours, ' + diff.minutes + ' minutes, ' + diff.seconds + ' seconds';
        } else if (diff.minutes) {
            str = diff.minutes + ' minutes, ' + diff.seconds + ' seconds';
        } else {
            str = diff.seconds_raw + ' seconds';
        }

        return str;
    };

module.exports = {
    error: function(str) {
        console.error(str.red);
    },
    log: function(str) {
        console.log(str.bold.blue);
    },
    status: function(json, start, end) {
        var str = (json.failed ? bad.bold.red : good.bold.green) + 
            ' ' + ('[' + json.name + ']:').bold.blue +
            ' Passed: ' + (json.passed ? (''+json.passed).green : json.passed) +
            ' Failed: ' + (json.failed ? (''+json.failed).red : json.failed) +
            ' Total: ' +  json.total +
            (' (ignored ' + json.ignored + ')').grey;
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

        if (start && end) {
            module.exports.log('  [Timer] ' + timer(start, end));
        }
        
    }
}
