import ExtendableError from 'extendable-error';

/**
 * ExpectedError class.
 */
export class ExpectedError extends ExtendableError {
    constructor(
        public code: number,
        message = ErrorMessages[code] || ErrorMessages[ErrorCode.unknown],
        public status = ExpectedError.defaultStatus
    ) {
        super(message);
    }

    static defaultStatus = 500;
}

export enum ErrorCode {
    none = 0,

    // permission error
    permissionDenied = 1000,

    // unknown
    unknown = -1
}

export let ErrorMessages: {
    [code: number]: string;
} = {
    [ErrorCode.unknown]: 'Unknown error.',
    [ErrorCode.permissionDenied]: 'Permission denied.'
};

/** Error transformer */
export interface ErrorTransformer {
    (reason: any): any;
}
