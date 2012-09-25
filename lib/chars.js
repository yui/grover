//Opening this on windows will likely bork the characters

exports.good = "✔";
exports.bad = "✖";

if (process.platform === 'win32') {
    exports.good = 'OK';
    exports.bad = 'X';
}
