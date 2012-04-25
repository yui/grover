#!/bin/bash

cd "$(dirname "$0")"

phantom=`which phantomjs`


if [ ! -f "${phantom}" ]; then
    echo "Failed to locate the phantomjs binary.."
    exit 1;
fi

version=`${phantom} -v`

yuitest="../node_modules/.bin/yuitest"

echo "PhantomJS: ${phantom}"
echo "Version: ${version}"

if [ ! -f "${yuitest}" ]; then
    echo "Failed to locate yuitest binary.."
    exit 1
fi

echo "YUITest: ${yuitest}"

echo "Starting YUITests"

${yuitest} ./test.js
