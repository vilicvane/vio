import * as FS from 'fs';
import * as Path from 'path';

import {
    Express,
    Router as ExpressRouter,
    IRouterMatcher as RouterMatcher,
    Request as ExpressRequest,
    Response as ExpressResponse,
    RequestHandler as ExpressRequestHandler
} from 'express';

import { Promise } from 'thenfail';

import {
    Route,
    Group,
    RouteHandler,
    RouteOptions,
    GroupOptions,
    Method
} from './route';

import { Response } from './response';
import { APIError, ErrorTransformer } from './api-error';

/**
 * Similar to `ExpressRequestHandler` but with no `next`.
 */
type RouteRequestHandler = (req: ExpressRequest, res: ExpressResponse) => void;

// WARNING
// We are using private Express properties for development purpose.

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

const PRODUCTION: boolean = !!process.env.PRODUCTION;

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
    /** Whether stringify results as json instead of renderring as templates data by default. */
    defaultAsJSON: boolean;
    /** Error transformer. */
    errorTransformer: ErrorTransformer;
    
    constructor(
        app: Express,
        {
            routesRoot = './routes',
            viewsRoot = './views',
            viewsExtension = '.hbs',
            errorViewsFolder = 'error',
            defaultSubsite,
            prefix,
            json = false
        }: {
            routesRoot?: string;
            viewsRoot?: string;
            viewsExtension?: string;
            errorViewsFolder?: string;
            defaultSubsite?: string;
            prefix?: string;
            json?: boolean;
        } = {}
    ) {
        this.app = <_Express>app;
        
        // Ensure root path ends without '/' or '\\'.
        routesRoot = routesRoot.replace(/[/\\]$/, '');
        viewsRoot = viewsRoot.replace(/[/\\]$/, '');
        
        this.routesRoot = routesRoot;
        this.viewsRoot = viewsRoot;
        this.errorViewsFolder = errorViewsFolder;
        this.viewsExtension = viewsExtension;
        this.defaultSubsite = defaultSubsite;
        this.defaultAsJSON = json;
        
        let prefixUsePath: string;
        
        // Ensure prefix starts but not ends with '/', i.e. '/prefix'.
        if (prefix && prefix !== '/') {
            if (prefix[0] !== '/') {
                prefix = '/' + prefix;
            }
            
            if (prefix[prefix.length - 1] === '/') {
                prefix = prefix.substr(0, prefix.length - 1);
            }
            
            this.prefix = prefix;
            
            prefixUsePath = prefix;
        } else {
            prefix = undefined;
            prefixUsePath = '/';
        }
        
        this.router = ExpressRouter();
        
        if (PRODUCTION) {
            // TODO: initialize productional router.
        } else {
            // this.app.set('view cache', false);
            
            app.use(prefixUsePath, (req, res, next) => {
                this.attachRoutesDynamicly(req.path);
                next();
            });
        }
        
        app.use(prefixUsePath, this.router);
        
        // Handle 404.
        app.use(prefixUsePath, (req, res) => this.handleNotFound(req, res));
    }
    
    /** A map of route file last modified timestamp. */
    private static lastModifiedMap: Dictionary<number> = {};
    
    /**
     * Attach route dynamicly based on requesting path.
     * Used only at development.
     */
    attachRoutesDynamicly(requestingPath: string): void {
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
        
        // Split requesting path to parts.
        // E.g., "/abc/def/ghi?query=xyz" would be splitted to:
        // ["/abc", "/def", "/ghi"]
        
        let pathRegex = /\/[^/?]+|/g;
        
        
        let lastPossibleRouteModulePath = '';
        let pathPart: string;
        let pathParts: string[] = [];
        
        while (pathPart = pathRegex.exec(requestingPath)[0]) {
            pathParts.push(pathPart);
        }
        
        let firstPathPart = pathParts[0];
        let isDefaultSubsite: boolean;
        
        if (this.defaultSubsite) {
            if (firstPathPart && firstPathPart.substr(1) === this.defaultSubsite) {
                isDefaultSubsite = true;
            } else if (
                !firstPathPart || (
                    firstPathPart.substr(1) !== this.defaultSubsite &&
                    !FS.existsSync(Path.join(this.routesRoot, firstPathPart))
                )
            ) {
                isDefaultSubsite = true;
                firstPathPart = '/' + this.defaultSubsite;
                pathParts.unshift(firstPathPart);
            } else {
                isDefaultSubsite = false;
            }
        } else {
            isDefaultSubsite = false;
        }
        
        let routeGuesses = this.defaultSubsite ? [] : [
            {
                path: '',
                lastPart: '',
                modulePaths: ['/default.js']
            }
        ];
        
        for (let i = 0; i < pathParts.length; i++) {
            pathPart = pathParts[i];
            
            lastPossibleRouteModulePath += pathPart;
            
            // If it has defaultSubsite configured, do not search the containing folder.
            let modulePaths = i  === 0 && this.defaultSubsite ? [
                `${lastPossibleRouteModulePath}/default.js`,
                `${lastPossibleRouteModulePath}${pathPart}.js`
            ] : [
                `${lastPossibleRouteModulePath}.js`,
                `${lastPossibleRouteModulePath}/default.js`,
                `${lastPossibleRouteModulePath}${pathPart}.js`
            ];
            
            routeGuesses.push({
                path: lastPossibleRouteModulePath,
                lastPart: pathPart,
                modulePaths
            });
        }
        
        for (let routeGuess of routeGuesses) {
            for (let modulePath of routeGuess.modulePaths) {
                modulePath = Path.join(this.routesRoot, modulePath);
                
                if (!FS.existsSync(modulePath)) {
                    continue;
                }
                
                let GroupClass: typeof Group;
                
                try {
                    let resolvedPossiblePath = require.resolve(modulePath);
                    let lastModified = FS.statSync(resolvedPossiblePath).mtime.getTime();
                    
                    if (resolvedPossiblePath in Router.lastModifiedMap) {
                        if (Router.lastModifiedMap[resolvedPossiblePath] !== lastModified) {
                            // Avoid cache.
                            delete require.cache[resolvedPossiblePath];
                            Router.lastModifiedMap[resolvedPossiblePath] = lastModified;
                        }
                    } else {
                        Router.lastModifiedMap[resolvedPossiblePath] = lastModified;
                    }
                    
                    // We use the `exports.default` as the target `GroupClass`.
                    GroupClass = require(modulePath)['default'];
                } catch (e) {
                    console.warn(`Failed to load route module "${modulePath}".`);
                    continue;
                }
                
                let routes = GroupClass && GroupClass.routes;
                
                if (!routes) {
                    console.warn(`No \`GroupClass\` or valid \`GroupClass\` found under \`exports.default\` in route module "${modulePath}".`);
                    continue;
                }
                
                for (let route of routes) {
                    let method = route.method;
                    
                    let path = routeGuess.path + (route.path ? '/' + route.path : '');
                    
                    if (route.view) {
                        let specifiedViewPath = Path.resolve(this.viewsRoot, route.view);
                        route.view = specifiedViewPath;
                    } else if (!this.defaultAsJSON) {
                        let viewSearchPath = Path.join(this.viewsRoot, routeGuess.path);
                        
                        let possibleViewPaths = route.path ? [
                                Path.join(viewSearchPath, route.path + this.viewsExtension),
                                Path.join(viewSearchPath, route.path, 'default' + this.viewsExtension),
                                Path.join(viewSearchPath, route.path, 'default/default' + this.viewsExtension),
                                // Use `Path.basename` in case of route path like `ghi/jkl`.
                                Path.join(viewSearchPath, route.path, Path.basename(route.path) + this.viewsExtension)
                            ] : routeGuess.lastPart ? [
                                viewSearchPath + this.viewsExtension,
                                Path.join(viewSearchPath, 'default' + this.viewsExtension),
                                Path.join(viewSearchPath, 'default/default' + this.viewsExtension),
                                Path.join(viewSearchPath, routeGuess.lastPart + this.viewsExtension)
                            ] : [
                                viewSearchPath + this.viewsExtension,
                                Path.join(viewSearchPath, 'default' + this.viewsExtension),
                                Path.join(viewSearchPath, 'default/default' + this.viewsExtension)
                            ];
                        
                        for (let possibleViewPath of possibleViewPaths) {
                            if (FS.existsSync(possibleViewPath)) {
                                console.log(`Found view file:\n    "${possibleViewPath}".`);
                                route.view = possibleViewPath;
                                break;
                            }
                        }
                        
                        if (!route.view) {
                            console.warn(`Found none of these view files for route "${path}":\n    ${possibleViewPaths.join('\n    ')}`);
                        }
                    }
                    
                    let routeHandler = this.createRouteHandler(route);
                    
                    (<RouterMatcher<any>>(<any>router)[method])(path, routeHandler);
                    
                    if (isDefaultSubsite) {
                        (<RouterMatcher<any>>(<any>router)[method])(path.substr(firstPathPart.length), routeHandler);
                    }
                }
            }
        }
    }
    
    getSubsiteName(path: string): string {
        let part = /\/[^/?]+|/.exec(path)[0];
        
        if (part) {
            let subsiteDir = Path.join(this.routesRoot, part);
            if (FS.existsSync(subsiteDir)) {
                return part.substr(1);
            }
        }
        
        return this.defaultSubsite;
    }
    
    private processRequest(req: ExpressRequest, res: ExpressResponse, route: Route, next: Function): void {
        Promise
            .then(() => { })
            .then(() => route.handler(req, res))
            .then((result: Object|Response) => {
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
                } else if (this.defaultAsJSON) {
                    res.json({
                        data: result
                    });
                } else if (route.view) {
                    return new Promise<void>((resolve, reject) => {
                        res.render(route.view, result, (error, html) => {
                            if (error) {
                                reject(error);
                            } else {
                                res.send(html);
                                resolve();
                            }
                        });
                    });
                } else {
                    throw new Error('Missing view file.');
                }
            })
            .fail(reason => {
                let apiError: APIError;
                
                if (this.errorTransformer) {
                    apiError = this.errorTransformer(reason) || new APIError(-1);
                } else if (reason instanceof APIError) {
                    apiError = reason;
                }
                
                if (!res.headersSent) {
                    this.handleServerError(req, res, apiError && apiError.status);
                }
                
                if (!apiError) {
                    throw reason;
                }
            })
            .log();
            // .done();
    }
    
    private handleNotFound(req: ExpressRequest, res: ExpressResponse): void {
        this.renderErrorPage(req, res, 404);
    }
    
    private handleServerError(req: ExpressRequest, res: ExpressResponse, status = 500): void {
        this.renderErrorPage(req, res, status);
    }
    
    private renderErrorPage(req: ExpressRequest, res: ExpressResponse, status: number): void {
        res.status(status);
        
        let statusStr = status.toString();
        let subsiteName = this.getSubsiteName(req.path) || '';
        
        let possibleFileNames = [
            statusStr + this.viewsExtension,
            statusStr.substr(0, 2) + 'x' + this.viewsExtension,
            statusStr.substr(0, 1) + 'xx' + this.viewsExtension
        ];
        
        for (let fileName of possibleFileNames) {
            let viewPath = Path.join(this.viewsRoot, subsiteName, this.errorViewsFolder, fileName);
            
            if (FS.existsSync(viewPath)) {
                res.render(viewPath, {
                    url: req.url,
                    status
                });
                
                return;
            }
        }
        
        let defaultMessage = status === 404 ?
            `Page not found.<br />
Keep calm and visit <a href="https://vane.life/">https://vane.life/</a>.` :
            `Something happened (${status}).<br />
Keep calm and visit <a href="https://vane.life/">https://vane.life/</a>.`;
        
        res
            .type('text/html')
            .send(defaultMessage);
    }
    
    private createRouteHandler(route: Route): ExpressRequestHandler {
        return (req, res, next) => {
            this.processRequest(req, res, route, next);
        };
    }
    
    /**
     * Transform identifier name like:
     * 1. "helloWorld" to "hello-world",
     * 2. "parseJSONString" to "parse-json-string".
     */
    static getPathPartByIdentifierName(identifierName: string): string {
        let upperCaseRegex = /[A-Z]+(?=[A-Z][a-z]|$)|[A-Z]/g;
        
        return identifierName.replace(upperCaseRegex, (m: string, index: number) => {
            return (index ? '-' : '') + m.toLowerCase();
        });
    }
}

export namespace Router {
    /** @decoraotr */
    export function route(options: RouteOptions) {
        return (GroupClass: typeof Group, name: string) => {
            let handler = (<Dictionary<RouteHandler>><any>GroupClass)[name];
            
            if (!GroupClass.routes) {
                GroupClass.routes = [];
            }
            
            let method = (Method[options.method] || 'all').toLowerCase();
            
            let path = options.path;
            
            if (!path && name !== 'default') {
                path = Router.getPathPartByIdentifierName(name);
            }
            
            let view = options.view;
            
            GroupClass.routes.push({
                method,
                path,
                view,
                handler
            });
        };
    }
    
    /** @decorator */
    export function GET(options = <RouteOptions>{}) {
        options.method = Method.GET;
        return route(options);
    }
    
    /** @decorator */
    export function POST(options = <RouteOptions>{}) {
        options.method = Method.POST;
        return route(options);
    }
    
    /** @decorator */
    export function group(options: GroupOptions = {}) {
        return (GroupClass: typeof Group) => {
            // let {
            //     
            // } = options;
            // 
            // GroupClass.options = {
            //     
            // };
        };
    }
}

export default Router;
