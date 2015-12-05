/**
 * APIError class.
 */
export class APIError extends Error {
    name = (this.constructor as any).name;
    stack: string;
    
    constructor(
        public code: number,
        public message = APIErrorMessages[code] || APIErrorMessages[APIErrorCode.unknown],
        public status = APIError.defaultStatus
    ) {
        super(message);
        this.stack = (new Error() as any).stack.replace(/\s+at new APIError .+/, '');
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

export let APIErrorMessages: {
    [code: number]: string;
} = {
    [APIErrorCode.unknown]: 'Unknown error.',
    [APIErrorCode.permissionDenied]: 'Permission denied.'
};

/** Error transformer */
export interface ErrorTransformer {
    (reason: any): any;
}
