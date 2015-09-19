import { Express, Router as ExpressRouter } from 'express';
import { Group, RouteOptions, GroupOptions } from './route';
import { ErrorTransformer } from './api-error';
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
    /** Whether stringify results as json instead of renderring as templates data by default. */
    defaultAsJSON: boolean;
    /** Error transformer. */
    errorTransformer: ErrorTransformer;
    constructor(app: Express, {routesRoot, viewsRoot, viewsExtension, errorViewsFolder, defaultSubsite, prefix, json}?: {
        routesRoot?: string;
        viewsRoot?: string;
        viewsExtension?: string;
        errorViewsFolder?: string;
        defaultSubsite?: string;
        prefix?: string;
        json?: boolean;
    });
    /** A map of route file last modified timestamp. */
    private static lastModifiedMap;
    /**
     * Attach route dynamicly based on requesting path.
     * Used only at development.
     */
    attachRoutesDynamicly(requestingPath: string): void;
    getSubsiteName(path: string): string;
    private processRequest(req, res, route, next);
    private handleNotFound(req, res);
    private handleServerError(req, res, status?);
    private renderErrorPage(req, res, status);
    private createRouteHandler(route);
    /**
     * Transform identifier name like:
     * 1. "helloWorld" to "hello-world",
     * 2. "parseJSONString" to "parse-json-string".
     */
    static getPathPartByIdentifierName(identifierName: string): string;
}
export declare namespace Router {
    /** @decoraotr */
    function route(options: RouteOptions): (GroupClass: typeof Group, name: string) => void;
    /** @decorator */
    function GET(options?: RouteOptions): (GroupClass: typeof Group, name: string) => void;
    /** @decorator */
    function POST(options?: RouteOptions): (GroupClass: typeof Group, name: string) => void;
    /** @decorator */
    function group(options?: GroupOptions): (GroupClass: typeof Group) => void;
}
export default Router;
