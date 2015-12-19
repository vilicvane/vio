import * as express from 'express';
import hyphenate from 'hyphenate';
import { Promise, Resolvable } from 'thenfail';

import { Router } from './router';

let hop: HOP = Object.prototype.hasOwnProperty;

export interface RouterOptions {
    prefix: string;
}

// TODO: use string literal type.
// export type HttpMethod = 'all' | 'get' | 'post' | 'put' | 'delete' | 'fetch' | 'head' | 'options';
export type HttpMethod = string;

export interface ControllerOptions {
    
}

export abstract class Controller {
    expired = false;
    routes: Route[];
    
    expire(): void {
        this.expired = true;
    }
}

export abstract class Resource {
    
}

export interface MethodOptions<TPermission> {
    /** Specify view path. */
    view?: string;
    /** Require authentication. */
    authentication?: boolean;
    /** Permission descriptor. */
    permission?: PermissionDescriptor<TPermission>;
    permissions?: PermissionDescriptor<TPermission>[];
}

export interface RouteOptions<TPermission> extends MethodOptions<TPermission> {
    /**
     * Path that will be appended to parent.
     * 
     * Accepts:
     * 1. abc-xyz
     * 2. abc-xyz/:paramA/:paramB
     * 3. :paramA/:paramB
     */
    path?: string;
}

export interface Route {
    method: string;
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

/** @decorator */
export function route<TPermission>(method: HttpMethod, options: RouteOptions<TPermission> = {}) {
    return (controllerPrototype: Controller, name: string, descriptor: PropertyDescriptor) => {
        if (!controllerPrototype.routes) {
            controllerPrototype.routes = [];
        }
        
        let handler = descriptor.value;
        
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
        
        controllerPrototype.routes.push({
            method: method.toLowerCase(),
            path,
            view,
            handler,
            authentication,
            permissionDescriptor
        });
    };
}

/** @decorator */
export function method<TPermission>(options?: MethodOptions<TPermission>) {
    return (controller: Controller, name: string, descriptor: PropertyDescriptor) => {
        return route(name, options)(controller, 'default', descriptor);
    };
}

/** @decorator */
export function get<TPermission>(options?: RouteOptions<TPermission>) {
    return route('get', options);
}

/** @decorator */
export function post<TPermission>(options?: RouteOptions<TPermission>) {
    return route('post', options);
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
