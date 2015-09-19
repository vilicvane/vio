import * as express from 'express';
import { Promise } from 'thenfail';

import { Router } from './router';

let hop: HOP = Object.prototype.hasOwnProperty;

export interface RouterOptions {
    prefix: string;
}

export enum Method {
    ALL,
    GET,
    POST
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

export class Group {
    static expired: boolean;
    static options: GroupOptions;
    static routes: Route[];
    
    static expire(): void {
        this.expired = true;
        this.options = undefined;
        this.routes = undefined;
    }
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

export type RouteHandler = (req: Request, res: Response) => any;
