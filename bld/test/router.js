require('source-map-support').install();
var Path = require('path');
var util_1 = require('util');
var _1 = require('../');
describe('router', function () {
    var router = {
        defaultSubsite: undefined,
        viewsRoot: 'views-root',
        viewsExtension: '.hbs',
        getPossibleRoutePaths: _1.Router.prototype.getPossibleRoutePaths,
        getPossibleViewPaths: _1.Router.prototype.getPossibleViewPaths
    };
    context('#getPossibleRoutePaths', function () {
        context('default subsite not configured', function () {
            var samples = [
                [
                    'abc/def.js',
                    undefined,
                    ['/abc/def']
                ],
                [
                    'abc.js',
                    'def',
                    ['/abc/def']
                ],
                [
                    'abc/def.js',
                    'ghi',
                    ['/abc/def/ghi']
                ],
                [
                    'abc/default.js',
                    undefined,
                    ['/abc']
                ],
                [
                    'default.js',
                    undefined,
                    ['/']
                ],
                [
                    'default.js',
                    'abc',
                    ['/abc']
                ],
                [
                    'abc.js',
                    undefined,
                    ['/abc']
                ]
            ];
            var _loop_1 = function(sample) {
                it("should get correct possible paths (" + util_1.inspect(sample[0]) + ", " + util_1.inspect(sample[1]) + ")", function () {
                    router
                        .getPossibleRoutePaths(sample[0], sample[1])
                        .should.deep.equal(sample[2]);
                });
            };
            for (var _i = 0, samples_1 = samples; _i < samples_1.length; _i++) {
                var sample = samples_1[_i];
                _loop_1(sample);
            }
        });
        context('default subsite configured as "abc"', function () {
            var samples = [
                [
                    'abc/def.js',
                    undefined,
                    ['/def', '/abc/def']
                ],
                [
                    'abc/def.js',
                    'ghi',
                    ['/def/ghi', '/abc/def/ghi']
                ],
                [
                    'abc/default.js',
                    undefined,
                    ['/', '/abc']
                ]
            ];
            before(function () {
                router.defaultSubsite = 'abc';
            });
            var _loop_2 = function(sample) {
                it("should get correct possible paths (" + util_1.inspect(sample[0]) + ", " + util_1.inspect(sample[1]) + ")", function () {
                    router
                        .getPossibleRoutePaths(sample[0], sample[1])
                        .should.deep.equal(sample[2]);
                });
            };
            for (var _i = 0, samples_2 = samples; _i < samples_2.length; _i++) {
                var sample = samples_2[_i];
                _loop_2(sample);
            }
        });
    });
    context('#getPossibleViewPaths', function () {
        var samples = [
            [
                'abc/def.js',
                undefined,
                [
                    'views-root/abc/def.hbs',
                    'views-root/abc/def/default.hbs',
                    'views-root/abc/def/default/default.hbs',
                    'views-root/abc/def/def.hbs',
                    'views-root/abc/def/default/def.hbs'
                ]
            ],
            [
                'abc.js',
                'def',
                [
                    'views-root/abc/def.hbs',
                    'views-root/abc/def/default.hbs',
                    'views-root/abc/def/default/default.hbs',
                    'views-root/abc/def/def.hbs',
                    'views-root/abc/def/default/def.hbs'
                ]
            ],
            [
                'abc/def.js',
                'ghi',
                [
                    'views-root/abc/def/ghi.hbs',
                    'views-root/abc/def/ghi/default.hbs',
                    'views-root/abc/def/ghi/default/default.hbs',
                    'views-root/abc/def/ghi/ghi.hbs',
                    'views-root/abc/def/ghi/default/ghi.hbs'
                ]
            ],
            [
                'abc/default.js',
                undefined,
                [
                    'views-root/abc.hbs',
                    'views-root/abc/default.hbs',
                    'views-root/abc/default/default.hbs',
                    'views-root/abc/abc.hbs',
                    'views-root/abc/default/abc.hbs'
                ]
            ],
            [
                'default.js',
                undefined,
                [
                    'views-root/default.hbs',
                    'views-root/default/default.hbs'
                ]
            ],
            [
                'default.js',
                'abc',
                [
                    'views-root/abc.hbs',
                    'views-root/abc/default.hbs',
                    'views-root/abc/default/default.hbs',
                    'views-root/abc/abc.hbs',
                    'views-root/abc/default/abc.hbs'
                ]
            ],
            [
                'abc.js',
                undefined,
                [
                    'views-root/abc.hbs',
                    'views-root/abc/default.hbs',
                    'views-root/abc/default/default.hbs',
                    'views-root/abc/abc.hbs',
                    'views-root/abc/default/abc.hbs'
                ]
            ]
        ];
        var _loop_3 = function(sample) {
            it("should get correct possible paths (" + util_1.inspect(sample[0]) + ", " + util_1.inspect(sample[1]) + ")", function () {
                var paths = router.getPossibleViewPaths(sample[0], sample[1]);
                var expectedPaths = sample[2];
                paths.length.should.equal(expectedPaths.length);
                for (var i = 0; i < paths.length; i++) {
                    var path = paths[i];
                    var expectedPath = expectedPaths[i];
                    Path.relative(path, expectedPath).should.equal('');
                }
            });
        };
        for (var _i = 0, samples_3 = samples; _i < samples_3.length; _i++) {
            var sample = samples_3[_i];
            _loop_3(sample);
        }
    });
});
//# sourceMappingURL=router.js.map