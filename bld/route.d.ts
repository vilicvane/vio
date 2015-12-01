import * as express from 'express';
import { Resolvable } from 'thenfail';
export interface RouterOptions {
    prefix: string;
}
export declare enum HttpMethod {
    all = 0,
    get = 1,
    post = 2,
}
export interface ControllerOptions {
}
export declare abstract class Controller {
    static expired: boolean;
    static options: ControllerOptions;
    static permissionDescriptors: Map<string, PermissionDescriptor<any>>;
    static routes: Map<string, Route>;
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
export declare type ExpressRequest = express.Request;
export declare type ExpressResponse = express.Response;
export declare type RouteHandler = (req: Request<RequestUser<any>>, res: ExpressResponse) => any;
/** @decoraotr */
export declare function route(method: string | HttpMethod, options: RouteOptions): (ControllerClass: typeof Controller, name: string) => void;
/** @decorator */
export declare function get(options?: RouteOptions): (ControllerClass: typeof Controller, name: string) => void;
/** @decorator */
export declare function post(options?: RouteOptions): (ControllerClass: typeof Controller, name: string) => void;
export declare abstract class PermissionDescriptor<T> {
    abstract validate(userPermission: T): boolean;
    static or<T>(...permissions: PermissionDescriptor<T>[]): PermissionDescriptor<T>;
    static and<T>(...permissions: PermissionDescriptor<T>[]): PermissionDescriptor<T>;
}
export declare class CompoundOrPermissionDescriptor<T> extends PermissionDescriptor<T> {
    descriptors: PermissionDescriptor<T>[];
    constructor(descriptors: PermissionDescriptor<T>[]);
    validate(permission: T): boolean;
}
export declare class CompoundAndPermissionDescriptor<T> extends PermissionDescriptor<T> {
    descriptors: PermissionDescriptor<T>[];
    constructor(descriptors: PermissionDescriptor<T>[]);
    validate(permission: T): boolean;
}
/** @decoraotr */
export declare function permission<T>(...descriptors: PermissionDescriptor<T>[]): (ControllerClass: typeof Controller, name: string) => void;
export interface RequestUser<TPermission> {
    permission: TPermission;
}
export interface UserProvider<T extends RequestUser<any>> {
    get(req: ExpressRequest): Resolvable<T>;
    authenticate(req: ExpressRequest): Resolvable<T>;
}
