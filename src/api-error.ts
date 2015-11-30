/**
 * APIError class.
 */
export class APIError extends Error {
    name = (this.constructor as any).name;
    
    constructor(
        public code: number,
        message = 'Unknown error.',
        public status = 500
    ) {
        super(message);
    }
}

export enum APIErrorCode {
    none = 0,
    // permission error
    permissionDenied = 1000,
    
    // unknown
    unknown = -1
}

/** Error transformer */
export interface ErrorTransformer {
    (reason: any): APIError;
}
