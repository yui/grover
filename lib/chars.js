//Opening this on windows will likely bork the characters

exports.__defineGetter__('good', function() {
    return ((process.platform === 'win32') ? 'OK' : "✔");
});

exports.__defineGetter__('bad', function() {
    return ((process.platform === 'win32') ? 'X' : "✖");
});

