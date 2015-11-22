import * as express from 'express';
export interface RouterOptions {
    prefix: string;
}
export declare enum HttpMethod {
    all = 0,
    get = 1,
    post = 2,
}
export interface RouteGroupOptions {
}
export declare class RouteGroup {
    static expired: boolean;
    static options: RouteGroupOptions;
    static routes: Route[];
    static expire(): void;
}
export interface RouteOptions {
    /**
     * Path that will be appended to parent.
     *
     * Accepts:
     * 1. abc-xyz
     * 2. abc-xyz/:paramA/:paramB
     * 3. :paramA/:paramB
     */
    path?: string;
    /**
     * Specify view path.
     */
    view?: string;
}
export interface Route {
    methodName: string;
    path: string;
    view: string;
    resolvedView?: string;
    handler: RouteHandler;
}
export interface Request extends express.Request {
}
export interface ExpressResponse extends express.Response {
}
export declare type RouteHandler = (req: Request, res: ExpressResponse) => any;
/** @decoraotr */
export declare function route(method: string | HttpMethod, options: RouteOptions): (GroupClass: typeof RouteGroup, name: string) => void;
/** @decorator */
export declare function get(options?: RouteOptions): (GroupClass: typeof RouteGroup, name: string) => void;
/** @decorator */
export declare function post(options?: RouteOptions): (GroupClass: typeof RouteGroup, name: string) => void;
/** @decorator */
export declare function group(options?: RouteGroupOptions): (GroupClass: typeof RouteGroup) => void;
