/**
 * APIError class.
 */
export declare class APIError extends Error {
    code: number;
    status: number;
    name: any;
    constructor(code: number, message?: string, status?: number);
}
export declare enum APIErrorCode {
    none = 0,
    permissionDenied = 1000,
    unknown = -1,
}
/** Error transformer */
export interface ErrorTransformer {
    (reason: any): APIError;
}
