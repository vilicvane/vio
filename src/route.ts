import * as express from 'express';
import hyphenate from 'hyphenate';
import { Promise } from 'thenfail';

import { Router } from './router';

let hop: HOP = Object.prototype.hasOwnProperty;

export interface RouterOptions {
    prefix: string;
}

export enum HttpMethod {
    all,
    get,
    post
}

export interface RouteGroupOptions {
    
}

export class RouteGroup {
    static expired: boolean;
    static options: RouteGroupOptions;
    static routes: Route[];
    
    static expire(): void {
        this.expired = true;
        this.options = undefined;
        this.routes = undefined;
    }
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

export type RouteHandler = (req: Request, res: ExpressResponse) => any;


/** @decoraotr */
export function route(method: string | HttpMethod, options: RouteOptions) {
    return (GroupClass: typeof RouteGroup, name: string) => {
        let handler = (<Dictionary<RouteHandler>><any>GroupClass)[name];
        
        if (!GroupClass.routes) {
            GroupClass.routes = [];
        }
        
        let methodName: string;
        
        if (typeof method === 'string') {
            methodName = method.toLowerCase();
            if (!hop.call(HttpMethod, methodName)) {
                throw new Error(`Unsupported HTTP method "${method}"`);
            }
        } else {
            methodName = HttpMethod[method];
        }
        
        let path = options.path;
        
        if (!path && name !== 'default') {
            path = hyphenate(name);
        }
        
        let view = options.view;
        
        GroupClass.routes.push({
            methodName,
            path,
            view,
            handler
        });
    };
}

/** @decorator */
export function get(options = <RouteOptions>{}) {
    return route(HttpMethod.get, options);
}

/** @decorator */
export function post(options = <RouteOptions>{}) {
    return route(HttpMethod.post, options);
}

/** @decorator */
export function group(options: RouteGroupOptions = {}) {
    return (GroupClass: typeof RouteGroup) => {
        // let {
        //     
        // } = options;
        // 
        // GroupClass.options = {
        //     
        // };
    };
}




