import {Readable} from 'stream';

import {Response as ExpressResponse} from 'express';

import {ExpectedError, errorDefaults} from './expected-error';

export class Response {
  constructor(
    public type: string | undefined,
    public content: string | Buffer | Readable | undefined,
    public status = 200,
  ) {}

  applyTo(res: ExpressResponse): void {
    res.status(this.status);

    if (this.type) {
      res.type(this.type);
    }

    let content = this.content;

    if (content instanceof Readable) {
      content.pipe(res);
    } else {
      res.send(content);
    }
  }
}

export class Redirection extends Response {
  constructor(public url: string, status = 302) {
    super(undefined, undefined, status);
  }

  applyTo(res: ExpressResponse): void {
    res.header('Cache-Control', 'no-cache');
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
    let json = JSON.stringify({data});
    super('application/json', json, status);
  }
}

export class JSONErrorResponse extends Response {
  constructor(error: any, status?: number) {
    let code: string | undefined;
    let message: string | undefined;

    if (error instanceof ExpectedError) {
      status = status || error.status;
      code = error.code;
      message = error.message;
    } else {
      code = code || 'UNKNOWN';

      let errorDefault = errorDefaults[code];

      if (errorDefault) {
        status = status || errorDefault.status || 200;
        message = message || errorDefault.message;
      } else {
        errorDefault = errorDefaults['UNKNOWN'];
        status = status || errorDefault.status;
        message = message || code;
      }
    }

    let json = JSON.stringify({
      error: {
        code,
        message,
      },
    });

    super('application/json', json, status);
  }
}

export class JSONRedirection extends Response {
  constructor(url: string, status?: number) {
    let json = JSON.stringify({location: url});
    super('application/json', json, status);
  }
}
