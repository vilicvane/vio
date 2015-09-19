import * as express from 'express';
export interface RouterOptions {
    prefix: string;
}
export declare enum Method {
    ALL = 0,
    GET = 1,
    POST = 2,
}
export interface RouteOptions {
    method: Method;
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
export interface GroupOptions {
}
export declare class Group {
    static expired: boolean;
    static options: GroupOptions;
    static routes: Route[];
    static expire(): void;
}
export interface Route {
    method: string;
    path: string;
    view: string;
    handler: RouteHandler;
}
export interface Request extends express.Request {
}
export interface Response extends express.Response {
}
export declare type RouteHandler = (req: Request, res: Response) => any;
