import * as FS from 'fs';
import * as Path from 'path';

import * as glob from 'glob';
import * as Chalk from 'chalk';

const vioRequire: NodeRequire = require('./require')(require);

import {
    Express,
    Router as ExpressRouter,
    IRouterMatcher as ExpressRouterMatcher,
    Request as ExpressRequest,
    Response as ExpressResponse,
    RequestHandler as ExpressRequestHandler
} from 'express';

import { Promise } from 'thenfail';

import {
    HttpMethod,
    Route,
    RouteHandler,
    RouteOptions,
    Controller,
    ControllerOptions,
    PermissionDescriptor,
    UserProvider,
    RequestUser,
    Response,
    APIError,
    APIErrorCode,
    APIErrorMessages,
    ErrorTransformer
} from './';

/**
 * Similar to `ExpressRequestHandler` but with no `next`.
 */
type RouteRequestHandler = (req: ExpressRequest, res: ExpressResponse) => void;

interface RouteGuess {
    routePath: string;
    lastPart: string;
    routeFilePaths: string[];
}

// WARNING
// we are using private Express properties for development purpose.

//#region Express private properties

export interface _ExpressLayer {
    handle: ExpressRouter;
}

export interface _ExpressRootRouter {
    stack: _ExpressLayer[]; 
}

export interface _Express extends Express {
    _router: _ExpressRootRouter; 
}

//#endregion

const PRODUCTION = process.env.NODE_ENV === 'production';

const hop: HOP = Object.prototype.hasOwnProperty;

export class Router {
    /** Root of route files on file system, ends without '/'. */
    routesRoot: string;
    /** Root of views files on file system, ends without '/'. */
    viewsRoot: string;
    /** Extension of view files. */
    viewsExtension: string;
    /** Error view files folder name. */
    errorViewsFolder: string;
    /** Default sub site. */
    defaultSubsite: string;
    /** Prefix of requesting path, starts with '/' but ends without '/'. */
    prefix: string;
    /** Express application. */
    app: _Express;
    /** Actual router behind the scence. */
    router: ExpressRouter;
    /** Error transformer. */
    errorTransformer: ErrorTransformer;
    /** User provider. */
    userProvider: UserProvider<RequestUser<any>>;
    
    constructor(
        app: Express,
        {
            routesRoot = './routes',
            viewsRoot = './views',
            viewsExtension,
            errorViewsFolder = 'error',
            defaultSubsite,
            prefix,
            production = PRODUCTION
        }: {
            routesRoot?: string;
            viewsRoot?: string;
            viewsExtension?: string;
            errorViewsFolder?: string;
            defaultSubsite?: string;
            prefix?: string;
            production?: boolean;
        } = {}
    ) {
        this.app = app as _Express;
        
        this.routesRoot = Path.resolve(routesRoot);
        this.viewsRoot = Path.resolve(viewsRoot);
        this.errorViewsFolder = errorViewsFolder;
        
        if (viewsExtension) {
            if (viewsExtension[0] !== '.') {
                viewsExtension = '.' + viewsExtension;
            }
            
            this.viewsExtension = viewsExtension;
        }
        
        this.defaultSubsite = defaultSubsite;
        
        // ensure prefix starts but not ends with '/', i.e. '/prefix'.
        if (prefix) {
            if (prefix !== '/') {
                if (prefix[0] !== '/') {
                    prefix = '/' + prefix;
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
        
        if (production) {
            this.attachRoutes();
        } else {
            // this.app.set('view cache', false);
            
            app.use(prefix, (req, res, next) => {
                this.attachRoutesDynamically(req.path);
                next();
            });
        }
        
        app.use(prefix, this.router);
        
        // handle 404.
        app.use(prefix, (req, res) => this.handleNotFound(req, res));
    }
    
    ////////////////
    // PRODUCTION //
    ////////////////
    
    /**
     * @production
     * Attouch routes synchronously when starting up in production environment.
     */
    private attachRoutes(): void {
        console.log('loading routes...');
        
        let routeFilePaths = glob.sync('**/*.js', {
            cwd: this.routesRoot
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
        let ControllerClass: typeof Controller = require(modulePath).default;
        
        this.attachRoutesOnController(ControllerClass, routeFilePath);
    }
    
    /////////////////
    // DEVELOPMENT //
    /////////////////
    
    /**
     * @development
     * Attach routes dynamicly and synchronously based on request path.
     * Used only at development.
     */
    private attachRoutesDynamically(requestPath: string): void {
        console.log('dynamicly loading possible routes...');
        
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
        
        for (let i = 0; i < expressRouterStack.length; i++) {
            if (expressRouterStack[i].handle === previousRouter) {
                expressRouterStack[i].handle = router;
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
            !firstPathPart || (
                firstPathPart !== this.defaultSubsite &&
                !FS.existsSync(Path.join(this.routesRoot, firstPathPart))
            )
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
        
        let routeGuesses = this.defaultSubsite ? [] : [
            {
                routePath: '',
                lastPart: '',
                routeFilePaths: ['default.js']
            }
        ];
        
        let lastPossibleRoutePath = '';
        
        for (let i = 0; i < pathParts.length; i++) {
            let pathPart = pathParts[i];
            
            lastPossibleRoutePath += '/' + pathPart;
            
            // if it has default subsite configured, do not search the containing folder.
            let routeFilePaths = i === 0 && this.defaultSubsite ? [
                `${lastPossibleRoutePath}/default.js`,
                `${lastPossibleRoutePath}/${pathPart}.js`
            ] : [
                `${lastPossibleRoutePath}.js`,
                `${lastPossibleRoutePath}/default.js`,
                `${lastPossibleRoutePath}/${pathPart}.js`
            ];
            
            routeGuesses.push({
                routePath: lastPossibleRoutePath,
                lastPart: pathPart,
                routeFilePaths
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
            // we use the `exports.default` as the target controller class.
            ControllerClass = vioRequire(resolvedRouteFilePath).default;
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
     * e.g., "/abc/def/ghi?query=xyz" would be splitted to:
     * ["abc", "def", "ghi"]
     */
    private static splitRequestPath(path: string): string[] {
        // the empty string matching pattern (after `|`) is to prevent matching from skipping undesired substring.
        // for example, the query string part.
        return Router.splitPath(path, /\/?([^/?]+)|/g);
    }
    
    ////////////
    // COMMON //
    ////////////
    
    private static splitRoutePath(path: string): string[] {
        return Router.splitPath(path, /\/?([^/?*+:]+)|/g);
    }
    
    private static splitRouteFilePath(path: string): string[] {
        let parts: string[] = path.match(/[^\\/]+/g) || [];
        
        if (parts.length) {
            let lastIndex = parts.length - 1;
            parts[lastIndex] = parts[lastIndex].replace(/\.js$/gi, '');
        }
        
        if (parts.length && parts[parts.length - 1] === 'default') {
            parts.pop();
        }
        
        return parts;
    }
    
    private static splitPath(path: string, regex: RegExp): string[] {
        let part: string;
        let parts: string[] = [];
        
        while (part = regex.exec(path)[1]) {
            parts.push(part);
        }
        
        return parts;
    }
    
    private attachRoutesOnController(ControllerClass: typeof Controller, routeFilePath: string): void {
        let routes = ControllerClass && ControllerClass.routes;
        
        if (!routes) {
            console.error(`module "${routeFilePath}" does not export a valid controller.`);
            return;
        }
        
        let permissionDescriptors = ControllerClass.permissionDescriptors;
        
        routes.forEach((route, name) => {
            if (permissionDescriptors) {
                route.permissionDescriptor = permissionDescriptors.get(name);
            }
            
            this.attachSingleRoute(routeFilePath, route);
        });
    }
    
    private attachSingleRoute(routeFilePath: string, route: Route): void {
        route.resolvedView = this.resolveViewPath(routeFilePath, route);
        
        let router = this.router;
        let methodName = route.methodName;
        let routeHandler = this.createRouteHandler(route);
        
        let possibleRoutePaths = this.getPossibleRoutePaths(routeFilePath, route.path);
        
        for (let possibleRoutePath of possibleRoutePaths) {
            console.log(`${Chalk.green('*')} ${possibleRoutePath} ${Chalk.gray(route.resolvedView ? 'has-view' : 'no-view')}`);
            ((router as any)[methodName] as ExpressRouterMatcher<any>)(possibleRoutePath, routeHandler);
        }
    }
    
    private createRouteHandler(route: Route): ExpressRequestHandler {
        return (req, res, next) => {
            this.processRequest(req, res, route, next);
        };
    }
    
    private getPossibleRoutePaths(routeFilePath: string, routePath: string): string[] {
        let pathParts = Router.splitRouteFilePath(routeFilePath);
        
        let firstPart = pathParts.shift();
        // could be undefined if only one part (filename).
        let lastPart = pathParts.pop();
        
        let possiblePathPartsGroups: string[][] = [];
        
        let lastPartToConcat = lastPart ? [lastPart] : [];
        
        if (firstPart) {
            if (this.defaultSubsite === firstPart) {
                possiblePathPartsGroups.push(pathParts.concat(lastPartToConcat));
            }
            
            possiblePathPartsGroups.push([firstPart].concat(pathParts, lastPartToConcat));
        } else if (!this.defaultSubsite) {
            // `firstPart` is undefined means `pathParts` has 0 length.
            possiblePathPartsGroups.push(lastPartToConcat);
        } else {
            console.warn(`Routes in file "${routeFilePath}" will not be attached as default subsite is configured.`);
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
            
            return '/' + parts.join('/');
        });
    }
    
    private resolveViewPath(routeFilePath: string, route: Route): string {
        if (route.view) {
            return Path.join(this.viewsRoot, route.view);
        }
        
        if (!this.viewsExtension) {
            return undefined;
        }
        
        let possibleViewPaths = this.getPossibleViewPaths(routeFilePath, route.path);
        
        for (let possibleViewPath of possibleViewPaths) {
            if (FS.existsSync(possibleViewPath)) {
                return possibleViewPath;
            }
        }
        
        return undefined;
    }
    
    private getPossibleViewPaths(routeFilePath: string, routePath: string): string[] {
        let pathParts = Router.splitRouteFilePath(routeFilePath);
        
        if (routePath) {
            pathParts.push(...Router.splitRoutePath(routePath));
        }
        
        let viewSearchPath = Path.join(this.viewsRoot, ...pathParts);

        let possibleViewPaths: string[] = [];
        
        if (pathParts.length) {
            possibleViewPaths.push(viewSearchPath + this.viewsExtension);
        }
        
        possibleViewPaths.push(...[
            Path.join(viewSearchPath, 'default' + this.viewsExtension),
            Path.join(viewSearchPath, 'default', 'default' + this.viewsExtension)
        ]);
        
        if (pathParts.length) {
            let lastPart = pathParts[pathParts.length - 1];
            
            possibleViewPaths.push(...[
                Path.join(viewSearchPath, lastPart + this.viewsExtension),
                Path.join(viewSearchPath, 'default', lastPart + this.viewsExtension)
            ]);
        }
        
        return possibleViewPaths;
    }
    
    private processRequest(req: ExpressRequest, res: ExpressResponse, route: Route, next: Function): void {
        Promise
            .then(() => {
                if (this.userProvider) {
                    if (route.authentication) {
                        return this.userProvider.authenticate(req);
                    } else {
                        return this.userProvider.get(req);
                    }
                } else {
                    return undefined;
                }
            })
            .then(user => {
                let permissionDescriptor = route.permissionDescriptor;
                
                if (
                    permissionDescriptor &&
                    !permissionDescriptor.validate(user && user.permission)
                ) {
                    throw new APIError(APIErrorCode.permissionDenied, 'Permission denied', 403);
                }
                
                req.user = user;
            })
            .then(() => route.handler(req, res))
            .then((result: Object | Response) => {
                if (res.headersSent) {
                    if (result) {
                        console.warn(`Header has already been sent, but the route handler returns a non-null value.
${route.handler.toString()}`);
                    }
                    
                    return;
                }
                
                // Handle specified response.
                if (result instanceof Response) {
                    result.sendTo(res);
                } else if (route.resolvedView) {
                    return new Promise<void>((resolve, reject) => {
                        res.render(route.resolvedView, result, (error, html) => {
                            if (error) {
                                reject(error);
                            } else {
                                res.send(html);
                                resolve();
                            }
                        });
                    });
                } else {
                    res.json({
                        data: result
                    });
                }
            })
            .fail(error => {
                if (this.errorTransformer) {
                    error = this.errorTransformer(error) || error;
                }
                
                if (!res.headersSent) {
                    this.handleServerError(req, res, error);
                }
                
                if (!(error instanceof APIError)) {
                    throw error;
                }
            })
            .log();
    }
    
    private handleNotFound(req: ExpressRequest, res: ExpressResponse): void {
        this.renderErrorPage(req, res, 404);
    }
    
    private handleServerError(req: ExpressRequest, res: ExpressResponse, error: Error): void {
        if (this.viewsExtension) {
            this.renderErrorPage(req, res, 500);
        } else {
            let status: number;
            let code: number;
            let message: string;
            
            if (error instanceof APIError) {
                status = error.status;
                code = error.code;
                message = error.message;
            }
            
            status = status || 500;
            code = code || APIErrorCode.unknown;
            message = message || APIErrorMessages.unknown;
            
            res
                .status(status)
                .json({
                    error: {
                        code,
                        message
                    }
                });
        }
    }
    
    private renderErrorPage(req: ExpressRequest, res: ExpressResponse, status: number): void {
        res.status(status);
        
        let viewPath = this.findErrorPageViewPath(req.path, status);
        
        if (viewPath) {
            res.render(viewPath, {
                url: req.url,
                status
            });
        } else {
            // TODO: some beautiful default error pages.
            
            let defaultMessage = status === 404 ?
                `Page not found.<br />
Keep calm and read the doc <a href="https://github.com/vilic/vio">https://github.com/vilic/vio</a>.` :
                `Something wrong happened (${status}).<br />
Keep calm and read the doc <a href="https://github.com/vilic/vio">https://github.com/vilic/vio</a>.`;
            
            res
                .type('text/html')
                .send(defaultMessage);
        }
    }
    
    private findErrorPageViewPath(requestPath: string, status: number): string {
        let statusStr = status.toString();
        let subsiteName = this.getSubsiteName(requestPath) || '';
        
        let possibleFileNames = [
            statusStr + this.viewsExtension,
            statusStr.substr(0, 2) + 'x' + this.viewsExtension,
            statusStr.substr(0, 1) + 'xx' + this.viewsExtension
        ];
        
        for (let fileName of possibleFileNames) {
            let viewPath = Path.resolve(this.viewsRoot, subsiteName, this.errorViewsFolder, fileName);
            
            if (FS.existsSync(viewPath)) {
                return viewPath;
            }
        }
        
        return undefined;
    }
    
    private getSubsiteName(requestPath: string): string {
        let part = /\/[^/?]+|/.exec(requestPath)[0];
        
        if (part) {
            let subsiteDir = Path.join(this.routesRoot, part);
            
            // cache in production mode
            if (FS.existsSync(subsiteDir)) {
                return part.substr(1);
            }
        }
        
        return this.defaultSubsite;
    }
}

export default Router;
