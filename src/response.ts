import { Readable } from 'stream';

import { Response as ExpressResponse } from 'express';

export class Response {
    constructor(
        public type: string,
        public content: string | Buffer | Readable,
        public status = 200
    ) { }
    
    sendTo(res: ExpressResponse): void {
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

export class JSONResponse extends Response {
    constructor(data: any, status?: number) {
        super('application/json', JSON.stringify(data), status);
    }
}
