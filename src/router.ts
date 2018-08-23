// tslint:disable:member-ordering

import * as FS from 'fs';
import * as Path from 'path';
import * as Util from 'util';

import Chalk from 'chalk';
import {
  Express,
  IRouterMatcher as ExpressRouterMatcher,
  Request as ExpressRequest,
  RequestHandler as ExpressRequestHandler,
  Response as ExpressResponse,
  Router as ExpressRouter,
} from 'express';
import glob from 'glob';
import * as v from 'villa';

import {ErrorTransformer, ExpectedError} from './expected-error';
import {
  JSONDataResponse,
  JSONErrorResponse,
  JSONRedirection,
  Redirection,
  Response,
} from './response';
import {Controller, Request, Route, UserProvider} from './route';

// tslint:disable-next-line:no-var-requires no-require-imports
const vioRequire: NodeRequire = require('./@require')(require);

interface RouteGuess {
  routePath: string;
  lastPart: string;
  routeFilePaths: string[];
}

// WARNING
// We are using private Express properties for development purpose.

//#region Express private properties

// tslint:disable-next-line:class-name
export interface _ExpressLayer {
  handle: ExpressRouter;
}

// tslint:disable-next-line:class-name
export interface _ExpressRootRouter {
  stack: _ExpressLayer[];
}

// tslint:disable-next-line:class-name
export interface _Express extends Express {
  _router: _ExpressRootRouter;
}

//#endregion

const PRODUCTION = process.env.NODE_ENV === 'production';

export class Router {
  /** Root of route files on file system, ends without '/'. */
  routesRoot: string;

  /**
   * @production
   * Folder names under `routesRoot`.
   */
  subsiteFolderSet!: Set<string>;

  /** Root of views files on file system, ends without '/'. */
  viewsRoot: string;

  /** Extension of view files. */
  viewsExtension: string;

  /** Error view files folder name. */
  errorViewsFolder: string;

  /** Default sub site. */
  defaultSubsite: string | undefined;

  /** Prefix of requesting path, starts with '/' but ends without '/'. */
  prefix: string;

  /** Express application. */
  app: _Express;

  /** Actual router behind the scene. */
  router: ExpressRouter;

  /** Error transformer. */
  errorTransformer!: ErrorTransformer;

  /** User provider. */
  userProvider!: UserProvider<any>;

  /** Whether running under production mode. */
  production: boolean;

  constructor(
    app: Express,
    {
      routesRoot = './routes',
      viewsRoot = './views',
      viewsExtension = '.html',
      errorViewsFolder = 'error',
      defaultSubsite,
      prefix,
      production = PRODUCTION,
    }: {
      routesRoot?: string;
      viewsRoot?: string;
      viewsExtension?: string;
      errorViewsFolder?: string;
      defaultSubsite?: string;
      prefix?: string;
      production?: boolean;
    } = {},
  ) {
    this.app = app as _Express;

    this.routesRoot = Path.resolve(routesRoot);
    this.viewsRoot = Path.resolve(viewsRoot);
    this.errorViewsFolder = errorViewsFolder;

    if (viewsExtension[0] !== '.') {
      viewsExtension = `.${viewsExtension}`;
    }

    this.viewsExtension = viewsExtension;

    this.defaultSubsite = defaultSubsite;

    // Ensure prefix starts but not ends with '/', i.e. '/prefix'.
    if (prefix) {
      if (prefix !== '/') {
        if (prefix[0] !== '/') {
          prefix = `/${prefix}`;
        }

        if (prefix[prefix.length - 1] === '/') {
          prefix = prefix.substr(0, prefix.length - 1);
        }
      }
    } else {
      prefix = '/';
    }

    this.prefix = prefix;
    this.router = ExpressRouter();
    this.production = production;

    if (production) {
      let subsiteFolders = FS.readdirSync(this.routesRoot).filter(name =>
        FS.statSync(Path.join(this.routesRoot, name)).isDirectory(),
      );

      this.subsiteFolderSet = new Set(subsiteFolders);

      this.attachRoutes();
    } else {
      app.use(prefix, (req, _res, next) => {
        this.attachRoutesDynamically(req.path);
        next();
      });
    }

    app.use(prefix, this.router);

    // Handle 404.
    app.use(prefix, (req, res) => this.handleNotFound(req, res));
  }

  ////////////////
  // PRODUCTION //
  ////////////////

  /**
   * @production
   * Attach routes synchronously when starting up in production environment.
   */
  private attachRoutes(): void {
    console.info('Loading routes...');

    let routeFilePaths = glob.sync('**/*.js', {
      cwd: this.routesRoot,
    });

    for (let routeFilePath of routeFilePaths) {
      this.attachRoutesInFile(routeFilePath);
    }
  }

  /**
   * @production
   */
  private attachRoutesInFile(routeFilePath: string): void {
    let modulePath = Path.join(this.routesRoot, routeFilePath);

    // TODO: error handling
    let ControllerClass = Router.getControllerClass(require(modulePath));

    this.attachRoutesOnController(ControllerClass, routeFilePath);
  }

  /////////////////
  // DEVELOPMENT //
  /////////////////

  /**
   * @development
   * Attach routes dynamically and synchronously based on request path.
   * Used only at development.
   */
  private attachRoutesDynamically(requestPath: string): void {
    console.info('Dynamically loading possible routes...');

    this.replaceRouter();

    let routeGuesses = this.guessRoutes(requestPath);

    for (let routeGuess of routeGuesses) {
      for (let routeFilePath of routeGuess.routeFilePaths) {
        this.attachRoutesInFileDynamically(routeFilePath);
      }
    }
  }

  /**
   * @development
   */
  private replaceRouter(): void {
    let router = ExpressRouter();

    let previousRouter = this.router;
    this.router = router;

    let expressRouterStack = this.app._router.stack;

    for (let routerInStack of expressRouterStack) {
      if (routerInStack.handle === previousRouter) {
        routerInStack.handle = router;
        break;
      }
    }
  }

  /**
   * @development
   */
  private getCompletePathParts(requestPath: string): string[] {
    let pathParts = Router.splitRequestPath(requestPath);

    let firstPathPart = pathParts[0];

    if (
      this.defaultSubsite &&
      (!firstPathPart ||
        (firstPathPart !== this.defaultSubsite &&
          !FS.existsSync(Path.join(this.routesRoot, firstPathPart))))
    ) {
      pathParts.unshift(this.defaultSubsite);
    }

    return pathParts;
  }

  /**
   * @development
   */
  private guessRoutes(requestPath: string): RouteGuess[] {
    let pathParts = this.getCompletePathParts(requestPath);

    let routeGuesses = this.defaultSubsite
      ? []
      : [
          {
            routePath: '',
            lastPart: '',
            routeFilePaths: ['default.js'],
          },
        ];

    let lastPossibleRoutePath = '';

    for (let i = 0; i < pathParts.length; i++) {
      let pathPart = pathParts[i];

      lastPossibleRoutePath += `/${pathPart}`;

      // If it has default subsite configured, do not search the containing folder.
      let routeFilePaths =
        i === 0 && this.defaultSubsite
          ? [
              `${lastPossibleRoutePath}/default.js`,
              `${lastPossibleRoutePath}/${pathPart}.js`,
            ]
          : [
              `${lastPossibleRoutePath}.js`,
              `${lastPossibleRoutePath}/default.js`,
              `${lastPossibleRoutePath}/${pathPart}.js`,
            ];

      routeGuesses.push({
        routePath: lastPossibleRoutePath,
        lastPart: pathPart,
        routeFilePaths,
      });
    }

    return routeGuesses;
  }

  /**
   * @development
   */
  private attachRoutesInFileDynamically(routeFilePath: string): void {
    let resolvedRouteFilePath = Path.join(this.routesRoot, routeFilePath);

    if (!FS.existsSync(resolvedRouteFilePath)) {
      return;
    }

    let ControllerClass: typeof Controller;

    try {
      // We use the `exports.default` as the target controller class.
      ControllerClass = Router.getControllerClass(
        vioRequire(resolvedRouteFilePath),
      );
    } catch (error) {
      console.warn(`Failed to load route module "${resolvedRouteFilePath}".
${error.stack}`);
      return;
    }

    this.attachRoutesOnController(ControllerClass, routeFilePath);
  }

  /**
   * @development
   * Split request path to parts.
   * e.g., "/abc/def/ghi?query=xyz" would be split to:
   * ["abc", "def", "ghi"]
   */
  private static splitRequestPath(path: string): string[] {
    // The empty string matching pattern (after `|`) is to prevent matching from skipping undesired substring.
    // For example, the query string part.
    return Router.splitPath(path, /\/?([^/?]+)|/g);
  }

  ////////////
  // COMMON //
  ////////////

  private pathExistenceCache = new Map<string, boolean>();

  private fsExistsSync(path: string): boolean {
    if (this.production) {
      if (this.pathExistenceCache.has(path)) {
        return this.pathExistenceCache.get(path)!;
      } else {
        let exists = FS.existsSync(path);
        this.pathExistenceCache.set(path, exists);
        return exists;
      }
    } else {
      return FS.existsSync(path);
    }
  }

  private attachRoutesOnController(
    ControllerClass: typeof Controller,
    routeFilePath: string,
  ): void {
    let controller: Controller | undefined;
    let routes: Route[] | undefined;

    if (typeof ControllerClass === 'function') {
      controller = new (ControllerClass as any)() as Controller;
      routes = controller.routes;
    }

    if (!routes) {
      console.error(
        `module "${routeFilePath}" does not export a valid controller.`,
      );
      return;
    }

    for (let route of routes) {
      route.handler = route.handler.bind(controller);
      this.attachSingleRoute(routeFilePath, route);
    }
  }

  private attachSingleRoute(routeFilePath: string, route: Route): void {
    route.resolvedView = this.resolveViewPath(routeFilePath, route);

    let router = this.router;
    let methodName = route.method;
    let routeHandler = this.createRouteHandler(route);

    let possibleRoutePaths = this.getPossibleRoutePaths(
      routeFilePath,
      route.path,
    );

    for (let possibleRoutePath of possibleRoutePaths) {
      console.info(`${Chalk.green('*')} ${possibleRoutePath} \
${Chalk.gray(route.resolvedView ? 'has-view' : 'no-view')}`);
      ((router as any)[methodName] as ExpressRouterMatcher<any>)(
        possibleRoutePath,
        routeHandler,
      );
    }
  }

  private createRouteHandler(route: Route): ExpressRequestHandler {
    return (req, res, _next) => {
      this.processRequest(req, res, route);
    };
  }

  private getPossibleRoutePaths(
    routeFilePath: string,
    routePath: string | undefined,
  ): string[] {
    let pathParts = Router.splitRouteFilePath(routeFilePath);

    let firstPart = pathParts.shift();
    // Could be undefined if only one part (filename).
    let lastPart = pathParts.pop();

    let possiblePathPartsGroups: string[][] = [];

    let lastPartToConcat = lastPart ? [lastPart] : [];

    if (firstPart) {
      if (this.defaultSubsite === firstPart) {
        possiblePathPartsGroups.push(pathParts.concat(lastPartToConcat));
      }

      possiblePathPartsGroups.push(
        [firstPart].concat(pathParts, lastPartToConcat),
      );
    } else if (!this.defaultSubsite) {
      // `firstPart` is undefined means `pathParts` has 0 length.
      possiblePathPartsGroups.push(lastPartToConcat);
    } else {
      console.warn(
        `Routes in file "${routeFilePath}" will not be attached as default subsite is configured.`,
      );
    }

    return possiblePathPartsGroups.map(parts => {
      if (routePath) {
        if (routePath[0] === '/') {
          if (routePath.length > 1) {
            parts.push(routePath.slice(1));
          }
        } else {
          parts.push(routePath);
        }
      }

      return `/${parts.join('/')}`;
    });
  }

  private resolveViewPath(
    routeFilePath: string,
    route: Route,
  ): string | undefined {
    if (route.view) {
      return Path.join(this.viewsRoot, route.view);
    }

    if (!this.viewsExtension) {
      return undefined;
    }

    let possibleViewPaths = this.getPossibleViewPaths(
      routeFilePath,
      route.path,
    );

    for (let possibleViewPath of possibleViewPaths) {
      if (this.fsExistsSync(possibleViewPath)) {
        return possibleViewPath;
      }
    }

    return undefined;
  }

  private getPossibleViewPaths(
    routeFilePath: string,
    routePath: string | undefined,
  ): string[] {
    let pathParts = Router.splitRouteFilePath(routeFilePath);

    if (routePath) {
      pathParts.push(...Router.splitRoutePath(routePath));
    }

    let viewSearchPath = Path.join(this.viewsRoot, ...pathParts);

    let possibleViewPaths: string[] = [];

    if (pathParts.length) {
      possibleViewPaths.push(viewSearchPath + this.viewsExtension);
    }

    possibleViewPaths.push(
      ...[
        Path.join(viewSearchPath, `default${this.viewsExtension}`),
        Path.join(viewSearchPath, 'default', `default${this.viewsExtension}`),
      ],
    );

    if (pathParts.length) {
      let lastPart = pathParts[pathParts.length - 1];

      possibleViewPaths.push(
        ...[
          Path.join(viewSearchPath, lastPart + this.viewsExtension),
          Path.join(viewSearchPath, 'default', lastPart + this.viewsExtension),
        ],
      );
    }

    return possibleViewPaths;
  }

  private processRequest(
    req: ExpressRequest,
    res: ExpressResponse,
    route: Route,
  ): void {
    // tslint:disable:no-floating-promises
    (async () => {
      try {
        let user = this.userProvider
          ? route.authentication
            ? await this.userProvider.authenticate(req)
            : await this.userProvider.get(req)
          : undefined;

        let permissionDescriptor = route.permissionDescriptor;

        let validationResult = permissionDescriptor
          ? permissionDescriptor.validate(user && user.permission)
          : true;

        if (typeof validationResult === 'string') {
          if (route.resolvedView) {
            new Redirection(validationResult).applyTo(res);
          } else {
            new JSONRedirection(validationResult).applyTo(res);
          }

          return;
        }

        if (!validationResult) {
          throw new ExpectedError('PERMISSION_DENIED');
        }

        (req as Request<any>).user = user;

        let result = await route.handler(req as Request<any>, res);

        if (res.headersSent) {
          if (result) {
            console.warn(`Header has already been sent, but the route handler returns a non-null value.
${route.handler.toString()}`);
          }

          return;
        }

        // Handle specified response.
        if (result instanceof Response) {
          result.applyTo(res);
        } else if (route.resolvedView) {
          res.send(
            await v.call(res.render.bind(res), route.resolvedView, result),
          );
        } else {
          new JSONDataResponse(result).applyTo(res);
        }
      } catch (error) {
        if (this.errorTransformer) {
          error = this.errorTransformer(error) || error;
        }

        if (!res.headersSent) {
          this.handleServerError(req, res, error, !!route.resolvedView);
        }

        if (!(error instanceof ExpectedError)) {
          let output =
            typeof error === 'string'
              ? error
              : error instanceof Error
                ? error.stack || error.message
                : Util.inspect(error);
          console.warn(Chalk.red(output));
        }
      }
    })();
  }

  private handleNotFound(req: ExpressRequest, res: ExpressResponse): void {
    this.renderErrorPage(req, res, new ExpectedError('NOT_FOUND', 404));
  }

  private handleServerError(
    req: ExpressRequest,
    res: ExpressResponse,
    error: Error,
    hasView: boolean,
  ): void {
    if (hasView) {
      let expectedError: ExpectedError;

      if (error instanceof ExpectedError) {
        expectedError = error;
      } else {
        expectedError = new ExpectedError();
      }

      this.renderErrorPage(req, res, expectedError);
    } else {
      new JSONErrorResponse(error).applyTo(res);
    }
  }

  private renderErrorPage(
    req: ExpressRequest,
    res: ExpressResponse,
    expectedError: ExpectedError,
  ): void {
    let {code, message, status} = expectedError;

    res.status(status);

    let viewPath = this.findErrorPageViewPath(req.path, status);

    if (viewPath) {
      res.render(viewPath, {
        url: req.url,
        message,
        status,
      });
    } else {
      // TODO: some beautiful default error pages.

      res.type('text/html').send(`${message || code}<br />
Keep calm and read the doc <a href="https://github.com/vilic/vio">https://github.com/vilic/vio</a>.`);
    }
  }

  private findErrorPageViewPath(
    requestPath: string,
    status: number,
  ): string | undefined {
    let statusStr = status.toString();
    let subsiteName = this.getSubsiteName(requestPath) || '';

    let possibleFileNames = [
      statusStr + this.viewsExtension,
      `${statusStr.substr(0, 2)}x${this.viewsExtension}`,
      `${statusStr.substr(0, 1)}xx${this.viewsExtension}`,
    ];

    for (let fileName of possibleFileNames) {
      let viewPath = Path.join(this.errorViewsFolder, fileName);

      let possiblePaths = subsiteName
        ? [
            Path.resolve(this.viewsRoot, subsiteName, viewPath),
            Path.resolve(this.viewsRoot, viewPath),
          ]
        : [Path.resolve(this.viewsRoot, viewPath)];

      for (let path of possiblePaths) {
        if (this.fsExistsSync(path)) {
          return path;
        }
      }
    }

    return undefined;
  }

  private getSubsiteName(requestPath: string): string | undefined {
    let part = (/\/[^/?]+|/.exec(requestPath) || [])[0];

    if (part) {
      let folder = part.substr(1);

      if (this.production) {
        if (this.subsiteFolderSet.has(folder)) {
          return folder;
        }
      } else {
        let subsiteDir = Path.join(this.routesRoot, part);

        if (this.fsExistsSync(subsiteDir)) {
          return folder;
        }
      }
    }

    return this.defaultSubsite;
  }

  private static splitRoutePath(path: string): string[] {
    return Router.splitPath(path, /\/?([^/?*+:]+)|/g);
  }

  private static splitRouteFilePath(path: string): string[] {
    let parts: string[] = path.match(/[^\\/]+/g) || [];

    if (parts.length) {
      let lastIndex = parts.length - 1;
      parts[lastIndex] = parts[lastIndex].replace(/\.js$/gi, '');
    }

    if (
      parts.length &&
      (parts[parts.length - 1] === 'default' ||
        (parts.length >= 2 &&
          parts[parts.length - 1] === parts[parts.length - 2]))
    ) {
      parts.pop();
    }

    return parts;
  }

  private static splitPath(path: string, regex: RegExp): string[] {
    let part: string;
    let parts: string[] = [];

    // tslint:disable-next-line:no-conditional-assignment
    while ((part = (regex.exec(path) || [])[1])) {
      parts.push(part);
    }

    return parts;
  }

  private static getControllerClass(module: any): typeof Controller {
    return module.routes ? module : module.default;
  }
}

export default Router;
