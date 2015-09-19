import { Response as ExpressResponse } from 'express';

export class Response {
    constructor(
        public type: string,
        public content: string|Buffer,
        public status = 200
    ) { }
    
    sendTo(res: ExpressResponse): void {
        res
            .status(this.status)
            .type(this.type)
            .send(this.content);
    }
}

export class JSONResponse extends Response {
    constructor(data: any, status = 200) {
        super('application/json', JSON.stringify(data), status);
    }
}