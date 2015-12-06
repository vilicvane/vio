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
    post,
    put,
    delete,
    fetch,
    head,
    options
}

export interface ControllerOptions {
    
}

export abstract class Controller {
    static expired: boolean;
    static options: ControllerOptions;
    
    static routes: Map<string, Route>;
    
    static expire(): void {
        this.expired = true;
        this.options = undefined;
        this.routes = undefined;
    }
}

export interface RouteOptions<TPermission> {
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
    /** Permission descriptor. */
    permission?: PermissionDescriptor<TPermission>;
    permissions?: PermissionDescriptor<TPermission>[];
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
export function route<TPermission>(method: string | HttpMethod, options: RouteOptions<TPermission> = {}) {
    return (ControllerClass: typeof Controller, name: string, descriptor: PropertyDescriptor) => {
        if (!ControllerClass.routes) {
            ControllerClass.routes = new Map<string, Route>();
        }
        
        let handler: RouteHandler = descriptor.value.bind(ControllerClass);
        
        let methodName: string;
        
        if (typeof method === 'string') {
            methodName = method.toLowerCase();
            if (!hop.call(HttpMethod, methodName)) {
                throw new Error(`Unsupported HTTP method "${method}"`);
            }
        } else {
            methodName = HttpMethod[method];
        }
        
        let {
            path,
            view,
            authentication = false,
            permission,
            permissions
        } = options;
        
        if (!path && name !== 'default') {
            path = hyphenate(name, {
                lowerCase: true
            });
        }
        
        let permissionDescriptor = permission ?
            permission : permissions ?
            new CompoundOrPermissionDescriptor(permissions) : undefined;
        
        ControllerClass.routes.set(name, {
            methodName,
            path,
            view,
            handler,
            authentication,
            permissionDescriptor
        });
    };
}

/** @decorator */
export function get<TPermission>(options?: RouteOptions<TPermission>) {
    return route(HttpMethod.get, options);
}

/** @decorator */
export function post<TPermission>(options?: RouteOptions<TPermission>) {
    return route(HttpMethod.post, options);
}

// /** @decorator */
// export function controller(options: ControllerOptions = {}) {
//     return (ControllerClass: typeof Controller) => {
//         // ...
//     };
// }

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

export interface RequestUser<TPermission> {
    permission: TPermission;
}

export interface UserProvider<T extends RequestUser<any>> {
    get(req: ExpressRequest): Resolvable<T>;
    authenticate(req: ExpressRequest): Resolvable<T>;
}
