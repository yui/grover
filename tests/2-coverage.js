/*jshint multistr: true */
var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    cover = require('../lib/coverage'),
    exists = fs.existsSync || path.existsSync,
    coverageData = {"build/foo/foo.js": {
            lines: {
                '1': 1,
                '2': 2,
                '3': 3,
                '4': 0
            },
            functions: {
                'init:1': 1,
                'foo:2': 2,
                '(anonymous 1):3': 3
            },
            coveredLines: 4,
            calledLines: 3,
            coveredFunctions: 3,
            calledFunctions: 3,
            path: 'build/foo/foo.js'
        }
    },
    file = path.join(__dirname, 'out/lcov.info'),
    coverageFile = "TN:lcov.info\n\
SF:" + path.join(__dirname, 'build/foo/foo.js') + "\n\
FN:1,init\n\
FN:2,foo\n\
FN:3,(anonymous 1)\n\n\
FNDA:1,init\n\
FNDA:2,foo\n\
FNDA:3,(anonymous 1)\n\n\
FNF:3\n\
FNH:3\n\
DA:1,1\n\
DA:2,2\n\
DA:3,3\n\
DA:4,0\n\n\
LF:4\n\
LH:3\n\n\
end_of_record\n\n";

if (exists(file)) {
    fs.unlinkSync(file);
}

var tests = {
    'should parse lcov data': {
        topic: function() {
            cover.set(coverageData);
            var report = cover.getCoverageReport({
                sourceFilePrefix: __dirname
            });
            return report;
        },
        'and should be the same': function(topic) {
            assert.equal(coverageFile, topic, 'Failed to produce correct lcov report.');
        },
        'and should save report': {
            topic: function() {
                cover.set(coverageData);
                cover.save({
                    coverageFileName: file,
                    sourceFilePrefix: __dirname
                });
                return file;
            },
            'and should write file': function(topic) {
                assert.isTrue(exists(topic));
            }
        },
        'and should overwrite file': {
            topic: function() {
                cover.set(coverageData);
                cover.save({
                    coverageFileName: file,
                    sourceFilePrefix: __dirname
                });
                return file;
            },
            'and should make it here': function(topic) {
                assert.isTrue(exists(topic));
            }
        },
        'and should not throw on no file': {
            topic: function() {
                cover.set(coverageData);
                cover.save({
                    sourceFilePrefix: __dirname
                });
                return file;
            },
            'and should make it here': function(topic) {
                assert.ok(topic);
            }
        }
    },
    'istanbul JSON': {
        'with null object': {
            topic: function() {
                return cover.isIstanbul();
            },
            'should return false': function(topic) {
                assert.isFalse(topic);
            }
        },
        'with empty object': {
            topic: function() {
                return cover.isIstanbul({});
            },
            'should return false': function(topic) {
                assert.isFalse(topic);
            }
        },
        'with shallow object': {
            topic: function() {
                return cover.isIstanbul({
                    s: {},
                    fnMap: {}
                });
            },
            'should return true': function(topic) {
                assert.isTrue(topic);
            }
        },
        'with deep object': {
            topic: function() {
                return cover.isIstanbul({
                    foo: {
                        s: {},
                        fnMap: {}
                    }
                });
            },
            'should return true': function(topic) {
                assert.isTrue(topic);
            }
        },
        'should set with object': {
            topic: function() {
                cover.coverageInfo = {};
                cover.set({
                    s: {},
                    fnMap: {}
                });
                return cover.coverageInfo;
            },
            'and should be ok': function(topic) {
                assert.ok(topic);
            },
            'and should be an array': function(topic) {
                assert.isArray(topic);
            },
            'with 1 item': function(topic) {
                assert.equal(topic.length, 1);
            },
            'should set with array': {
                topic: function() {
                    cover.set({
                        s: {},
                        fnMap: {}
                    });
                    return cover.coverageInfo;
                },
                'and should be ok': function(topic) {
                    assert.ok(topic);
                },
                'and should be an array': function(topic) {
                    assert.isArray(topic);
                },
                'with 2 items': function(topic) {
                    assert.equal(topic.length, 2);
                }
            }
        }
    },
    'test path sorting': {
        topic: function() {
            return cover.pathSort;
        },
        'should be a function': function(topic) {
            assert.isFunction(topic);
        },
        'should sort up': {
            topic: function(topic) {
                var items = [
                    { foo: 'bar' },
                    { path: 'b/c.js' },
                    { path: 'a/a.js' },
                    { path: 'a/c.js' }
                ];
                return items.sort(topic);
            },
            'and they are ordered': function(topic) {
                assert.deepEqual(topic, [
                    { foo: 'bar' },
                    { path: 'a/a.js' },
                    { path: 'a/c.js' },
                    { path: 'b/c.js' }
                ]);
            }
        }
    }
};

/*jshint es5: true */
vows.describe('coverage').addBatch(tests).export(module);
