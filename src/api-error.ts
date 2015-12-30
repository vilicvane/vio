import ExtendableError from 'extendable-error';

/**
 * APIError class.
 */
export class APIError extends ExtendableError {
    constructor(
        public code: number,
        message = APIErrorMessages[code] || APIErrorMessages[APIErrorCode.unknown],
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
