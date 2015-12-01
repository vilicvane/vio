import { Express, Router as ExpressRouter } from 'express';
import { UserProvider, RequestUser, ErrorTransformer } from './';
export interface _ExpressLayer {
    handle: ExpressRouter;
}
export interface _ExpressRootRouter {
    stack: _ExpressLayer[];
}
export interface _Express extends Express {
    _router: _ExpressRootRouter;
}
export declare class Router {
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
    constructor(app: Express, {routesRoot, viewsRoot, viewsExtension, errorViewsFolder, defaultSubsite, prefix, json, production}?: {
        routesRoot?: string;
        viewsRoot?: string;
        viewsExtension?: string;
        errorViewsFolder?: string;
        defaultSubsite?: string;
        prefix?: string;
        json?: boolean;
        production?: boolean;
    });
    /**
     * @production
     * Attouch routes synchronously when starting up in production environment.
     */
    private attachRoutes();
    /**
     * @production
     */
    private attachRoutesInFile(routeFilePath);
    /**
     * @development
     * Attach routes dynamicly and synchronously based on request path.
     * Used only at development.
     */
    private attachRoutesDynamically(requestPath);
    /**
     * @development
     */
    private replaceRouter();
    /**
     * @development
     */
    private getCompletePathParts(requestPath);
    /**
     * @development
     */
    private guessRoutes(requestPath);
    /**
     * @development
     */
    private attachRoutesInFileDynamically(routeFilePath);
    /** A map of route file last modified timestamp. */
    private static lastModifiedTimestamps;
    /**
     * @development
     * Split request path to parts.
     * e.g., "/abc/def/ghi?query=xyz" would be splitted to:
     * ["abc", "def", "ghi"]
     */
    private static splitRequestPath(path);
    private static splitRoutePath(path);
    private static splitRouteFilePath(path);
    private static splitPath(path, regex);
    private attachRoutesOnController(ControllerClass, routeFilePath);
    private attachSingleRoute(routeFilePath, route);
    private createRouteHandler(route);
    private getPossibleRoutePaths(routeFilePath, routePath);
    private resolveViewPath(routeFilePath, route);
    private getPossibleViewPaths(routeFilePath, routePath);
    private processRequest(req, res, route, next);
    private handleNotFound(req, res);
    private handleServerError(req, res, status?);
    private renderErrorPage(req, res, status);
    private findErrorPageViewPath(requestPath, status);
    private getSubsiteName(requestPath);
}
export default Router;
