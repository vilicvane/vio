import { Readable } from 'stream';

import { Response as ExpressResponse } from 'express';

import {
    ExpectedError,
    ErrorCode,
    ErrorMessages
} from './';

export class Response {
    constructor(
        public type: string,
        public content: string | Buffer | Readable,
        public status = 200
    ) { }
    
    applyTo(res: ExpressResponse): void {
        res
            .status(this.status)
            .type(this.type);
        
        let content = this.content;
        
        if (content instanceof Readable) {
            content.pipe(res);
        } else {
            res.send(content);
        }
    }
}

export class Redirection extends Response {
    constructor(
        public url: string,
        status = 302
    ) {
        super(undefined, undefined, status);
    }
    
    applyTo(res: ExpressResponse): void {
        res.redirect(this.status, this.url);
    }
}

export class JSONResponse<T> extends Response {
    constructor(data: T, status?: number) {
        let json = JSON.stringify(data);
        super('application/json', json, status);
    }
}

export class JSONDataResponse<T> extends Response {
    constructor(data: T, status?: number) {
        let json = JSON.stringify({ data });
        super('application/json', json, status);
    }
}

export class JSONErrorResponse extends Response {
    constructor(error: any, status?: number) {
        let code: number;
        let message: string;
        
        if (error instanceof ExpectedError) {
            status = status || error.status;
            code = error.code;
            message = error.message;
        }
        
        status = status || 500;
        code = code || ErrorCode.unknown;
        message = message || ErrorMessages[code] || ErrorMessages[ErrorCode.unknown];
        
        let json = JSON.stringify({
            error: {
                code,
                message
            }
        });
        
        super('application/json', json, status);
    }
}

export class JSONRedirection extends Response {
    constructor(url: string, status?: number) {
        let json = JSON.stringify({ location: url });
        super('application/json', json, status);
    }
}
