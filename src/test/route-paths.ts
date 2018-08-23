import * as Path from 'path';
import {inspect} from 'util';

import Router from '../router';

describe('router', () => {
  let router: {
    defaultSubsite: string | undefined;
    viewsRoot: string;
    viewsExtension: string;
    getPossibleRoutePaths(
      routeFilePath: string,
      routePath: string | undefined,
    ): string;
    getPossibleViewPaths(
      routeFilePath: string,
      routePath: string | undefined,
    ): string;
  } = {
    defaultSubsite: undefined,
    viewsRoot: 'views-root',
    viewsExtension: '.hbs',
    getPossibleRoutePaths: (Router.prototype as any).getPossibleRoutePaths,
    getPossibleViewPaths: (Router.prototype as any).getPossibleViewPaths,
  };

  context('#getPossibleRoutePaths', () => {
    type Sample = [string, string | undefined, string[]];

    context('default subsite not configured', () => {
      let samples: Sample[] = [
        ['abc/def.js', undefined, ['/abc/def']],
        ['abc/abc.js', undefined, ['/abc']],
        ['abc/abc/abc.js', undefined, ['/abc/abc']],
        ['abc.js', 'def', ['/abc/def']],
        ['abc/abc.js', 'def', ['/abc/def']],
        ['abc/def/def.js', 'ghi', ['/abc/def/ghi']],
        ['abc/def/def/def.js', 'ghi', ['/abc/def/def/ghi']],
        ['abc/def.js', 'ghi', ['/abc/def/ghi']],
        ['abc/default.js', undefined, ['/abc']],
        ['default.js', undefined, ['/']],
        ['default.js', 'abc', ['/abc']],
        ['abc.js', undefined, ['/abc']],
      ];

      for (let sample of samples) {
        it(`should get correct possible paths (${inspect(sample[0])}, ${inspect(
          sample[1],
        )})`, () => {
          router
            .getPossibleRoutePaths(sample[0], sample[1])
            .should.deep.equal(sample[2]);
        });
      }
    });

    context('default subsite configured as "abc"', () => {
      let samples: Sample[] = [
        ['abc/def.js', undefined, ['/def', '/abc/def']],
        ['abc/def.js', 'ghi', ['/def/ghi', '/abc/def/ghi']],
        ['abc/default.js', undefined, ['/', '/abc']],
      ];

      before(() => {
        router.defaultSubsite = 'abc';
      });

      for (let sample of samples) {
        it(`should get correct possible paths (${inspect(sample[0])}, ${inspect(
          sample[1],
        )})`, () => {
          router
            .getPossibleRoutePaths(sample[0], sample[1])
            .should.deep.equal(sample[2]);
        });
      }
    });
  });

  context('#getPossibleViewPaths', () => {
    type Sample = [string, string | undefined, string[]];

    let samples: Sample[] = [
      [
        'abc/def.js',
        undefined,
        [
          'views-root/abc/def.hbs',
          'views-root/abc/def/default.hbs',
          'views-root/abc/def/default/default.hbs',
          'views-root/abc/def/def.hbs',
          'views-root/abc/def/default/def.hbs',
        ],
      ],
      [
        'abc.js',
        'def',
        [
          'views-root/abc/def.hbs',
          'views-root/abc/def/default.hbs',
          'views-root/abc/def/default/default.hbs',
          'views-root/abc/def/def.hbs',
          'views-root/abc/def/default/def.hbs',
        ],
      ],
      [
        'abc/def.js',
        'ghi',
        [
          'views-root/abc/def/ghi.hbs',
          'views-root/abc/def/ghi/default.hbs',
          'views-root/abc/def/ghi/default/default.hbs',
          'views-root/abc/def/ghi/ghi.hbs',
          'views-root/abc/def/ghi/default/ghi.hbs',
        ],
      ],
      [
        'abc/default.js',
        undefined,
        [
          'views-root/abc.hbs',
          'views-root/abc/default.hbs',
          'views-root/abc/default/default.hbs',
          'views-root/abc/abc.hbs',
          'views-root/abc/default/abc.hbs',
        ],
      ],
      [
        'default.js',
        undefined,
        ['views-root/default.hbs', 'views-root/default/default.hbs'],
      ],
      [
        'default.js',
        'abc',
        [
          'views-root/abc.hbs',
          'views-root/abc/default.hbs',
          'views-root/abc/default/default.hbs',
          'views-root/abc/abc.hbs',
          'views-root/abc/default/abc.hbs',
        ],
      ],
      [
        'abc.js',
        undefined,
        [
          'views-root/abc.hbs',
          'views-root/abc/default.hbs',
          'views-root/abc/default/default.hbs',
          'views-root/abc/abc.hbs',
          'views-root/abc/default/abc.hbs',
        ],
      ],
    ];

    for (let sample of samples) {
      it(`should get correct possible paths (${inspect(sample[0])}, ${inspect(
        sample[1],
      )})`, () => {
        let paths = router.getPossibleViewPaths(sample[0], sample[1]);
        let expectedPaths = sample[2];

        paths.length.should.equal(expectedPaths.length);

        for (let i = 0; i < paths.length; i++) {
          let path = paths[i];
          let expectedPath = expectedPaths[i];

          Path.relative(path, expectedPath).should.equal('');
        }
      });
    }
  });
});
