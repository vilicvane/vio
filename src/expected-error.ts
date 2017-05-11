import ExtendableError from 'extendable-error';

/**
 * ExpectedError class.
 */
export class ExpectedError extends ExtendableError {
  code: string;
  status: number;

  constructor(code?: string, status?: number);
  constructor(code: string, message: string, status?: number);
  constructor(
    code = 'UNKNOWN',
    message?: string | number,
    status?: number,
  ) {
    if (typeof message === 'number') {
      status = message;
      message = undefined;
    }

    super(message || defaultErrorMessages[code]);

    this.code = code;
    this.status = status || ExpectedError.defaultStatus;
  }

  static defaultStatus = 500;
}

export const defaultErrorMessages: {
  [code: string]: string;
} = {
  UNKNOWN: 'Unknown error.',
  PERMISSION_DENIED: 'Permission denied.',
  NOT_FOUND: 'Page not found.',
};

/** Error transformer */
export type ErrorTransformer = (reason: any) => any;
