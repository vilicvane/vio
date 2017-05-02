import * as Path from 'path';
import { Server } from 'http';

import * as glob from 'glob';
import * as express from 'express';

import { Router } from '../';
import { createExpressApp, request } from './helpers';
import { TestUserProvider } from './modules/user-provider';

interface Test {
  method: string;
  path: string;
  description: string;
  expected: {
    all?: TestExpectation;
    development?: TestExpectation;
    production?: TestExpectation;
  }
}

interface TestExpectation {
  status: number;
  contentType: string;
  content: string | Object;
}

interface TestConfig {
  defaultSubsite: string;
  viewsExtension: string;
  userProvider: boolean;
  tests: Test[];
}

describe('sites', () => {
  let siteRoutesDirNames = glob.sync('site-*-routes', {
    cwd: __dirname
  });

  for (let siteRoutesDirname of siteRoutesDirNames) {
    for (let production of [true, false]) {
      context(siteRoutesDirname + (production ? '(production mode)' : '(development mode)'), () => {
        let server: Server;
        let port = 10047;

        let baseUrl = `http://localhost:${port}`;
        let testPath = Path.join(__dirname, '../../test', siteRoutesDirname.replace(/-routes$/, ''));

        let {
          defaultSubsite,
          viewsExtension,
          userProvider: toUseUserProvider,
          tests
        }: TestConfig = require(Path.join(testPath, 'test-config.json'));

        before(() => {
          let app = createExpressApp();

          let router = new Router(app, {
            routesRoot: Path.join(__dirname, siteRoutesDirname),
            viewsRoot: Path.join(testPath, 'views'),
            viewsExtension,
            defaultSubsite,
            production
          });

          if (toUseUserProvider) {
            router.userProvider = new TestUserProvider();
          }

          server = app.listen(port);
        });

        after(() => {
          server.close();

          let cache = require.cache;

          for (let path of Object.keys(cache)) {
            if (/(?:[\\/]modules|-routes)[\\/]/.test(path)) {
              delete cache[path];
            }
          }
        });

        for (let test of tests) {
          it(`"${test.path}" ${test.description}`, () => {
            let expectation = test.expected.all || (
              production ?
                test.expected.production :
                test.expected.development
            );

            return request(test.method, baseUrl + test.path).then(result => {
              result.status.should.equal(expectation.status);

              if (expectation.contentType) {
                result.contentType.should.match(new RegExp(expectation.contentType));
              }

              if (expectation.content) {
                if (/json/.test(result.contentType)) {
                  (JSON.parse(result.content) as Object).should.deep.equal(expectation.content);
                } else {
                  result.content.should.match(new RegExp(expectation.content as string));
                }
              }
            });
          });
        }
      });
    }
  }
});
