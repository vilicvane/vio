/**
 * APIError class.
 */
export class APIError extends Error {
    constructor(
        public code: number,
        message = 'Unknown error.',
        public status = 500
    ) {
        super(message);
    }
}

/** Error transformer */
export type ErrorTransformer = (reason: any) => APIError;