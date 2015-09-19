/**
 * APIError class.
 */
export declare class APIError extends Error {
    code: number;
    status: number;
    constructor(code: number, message?: string, status?: number);
}
/** Error transformer */
export declare type ErrorTransformer = (reason: any) => APIError;
