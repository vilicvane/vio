/**
 * APIError class.
 */
export class APIError extends Error {
    name = (this.constructor as any).name;
    
    constructor(
        public code: number,
        message = 'Unknown error.',
        public status = APIError.defaultStatus
    ) {
        super(message);
    }
    
    static defaultStatus = 500;
}

export enum APIErrorCode {
    none = 0,
    
    // permission error
    permissionDenied = 1000,
    
    // unknown
    unknown = -1
}

export let APIErrorMessages = {
    unknown: 'Unkown error.'
};

/** Error transformer */
export interface ErrorTransformer {
    (reason: any): any;
}
