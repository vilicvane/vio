import * as express from 'express';
import hyphenate from 'hyphenate';
import { Promise, Resolvable } from 'thenfail';

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

export interface ControllerOptions {
    
}

export class Controller {
    static expired: boolean;
    static options: ControllerOptions;
    
    static permissionDescriptors = new Map<string, PermissionDescriptor<any>>();
    static routes = new Map<string, Route>();
    
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
    /** Specify view path. */
    view?: string;
    /** Require authentication. */
    authentication?: boolean;
}

export interface Route {
    methodName: string;
    path: string;
    view: string;
    resolvedView?: string;
    handler: RouteHandler;
    authentication: boolean;
    permissionDescriptor?: PermissionDescriptor<any>;
}

export interface Request<TUser extends RequestUser<any>> extends express.Request {
    user: TUser;
}

export type ExpressRequest = express.Request;
export type ExpressResponse = express.Response;

export type RouteHandler = (req: Request<RequestUser<any>>, res: ExpressResponse) => any;


/** @decoraotr */
export function route(method: string | HttpMethod, options: RouteOptions) {
    return (ControllerClass: typeof Controller, name: string) => {
        let handler: RouteHandler = (<any>ControllerClass)[name].bind(ControllerClass);
        
        let methodName: string;
        
        if (typeof method === 'string') {
            methodName = method.toLowerCase();
            if (!hop.call(HttpMethod, methodName)) {
                throw new Error(`Unsupported HTTP method "${method}"`);
            }
        } else {
            methodName = HttpMethod[method];
        }
        
        let { path, view, authentication = false } = options;
        
        if (!path && name !== 'default') {
            path = hyphenate(name);
        }
        
        ControllerClass.routes.set(name, {
            methodName,
            path,
            view,
            handler,
            authentication
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
export function controller(options: ControllerOptions = {}) {
    return (ControllerClass: typeof Controller) => {
        // ...
    };
}

export abstract class PermissionDescriptor<T> {
    abstract validate(userPermission: T): boolean;
    
    static or<T>(...permissions: PermissionDescriptor<T>[]): PermissionDescriptor<T> {
        return new CompoundOrPermissionDescriptor<T>(permissions);
    }
    
    static and<T>(...permissions: PermissionDescriptor<T>[]): PermissionDescriptor<T> {
        return new CompoundAndPermissionDescriptor<T>(permissions);
    }
}

export class CompoundOrPermissionDescriptor<T> extends PermissionDescriptor<T> {
    constructor(
        public descriptors: PermissionDescriptor<T>[]
    ) {
        super();
    }
    
    validate(permission: T): boolean {
        for (let descriptor of this.descriptors) {
            if (descriptor.validate(permission)) {
                return true;
            }
        }
        
        return false;
    }
}

export class CompoundAndPermissionDescriptor<T> extends PermissionDescriptor<T> {
    constructor(
        public descriptors: PermissionDescriptor<T>[]
    ) {
        super();
    }
    
    validate(permission: T): boolean {
        for (let descriptor of this.descriptors) {
            if (!descriptor.validate(permission)) {
                return false;
            }
        }
        
        return true;
    }
}

/** @decoraotr */
export function permission<T>(...descriptors: PermissionDescriptor<T>[]) {
    let descriptor = descriptors.length === 1 ?
        descriptors[0] :
        new CompoundOrPermissionDescriptor(descriptors);
    
    return (ControllerClass: typeof Controller, name: string) => {
        ControllerClass.permissionDescriptors.set(name, descriptor);
    };
}

export interface RequestUser<TPermission> {
    permission: TPermission;
}

export interface UserProvider<T extends RequestUser<any>> {
    get(req: ExpressRequest): Resolvable<T>;
    authenticate(req: ExpressRequest): Resolvable<T>;
}
