#!/usr/bin/env node

var path = require('path'),
    options = require(path.join(__dirname, '../lib/options')).parse(process.argv.slice(2)),
    util = require(path.join(__dirname, '../lib/')),
    grover = require('../lib/grover');


if (!options.paths.length) {
    console.error('No files given');
    util.exit(1);
}

grover.process();
