import { Response as ExpressResponse } from 'express';
export declare class Response {
    type: string;
    content: string | Buffer;
    status: number;
    constructor(type: string, content: string | Buffer, status?: number);
    sendTo(res: ExpressResponse): void;
}
export declare class JSONResponse extends Response {
    constructor(data: any, status?: number);
}
