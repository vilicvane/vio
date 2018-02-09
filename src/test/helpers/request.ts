// tslint:disable:no-implicit-dependencies

import * as sendRequest from 'request';

export interface RequestResult {
  status: number;
  contentType: string;
  content: string;
}

export function request(method: string, url: string): Promise<RequestResult> {
  return new Promise<RequestResult>((resolve, reject) => {
    sendRequest(url, {method}, (error, res, content) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        status: res.statusCode,
        contentType: res.headers['content-type']!,
        content,
      });
    });
  });
}
