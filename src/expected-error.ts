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
    code: string = 'UNKNOWN',
    message?: string | number,
    status?: number,
  ) {
    if (typeof message === 'number') {
      status = message;
      message = undefined;
    }

    let errorDefault = errorDefaults[code];

    if (errorDefault) {
      status = status || errorDefault.status || 200;
      message = message || errorDefault.message;
    } else {
      errorDefault = errorDefaults['UNKNOWN'];
      status = status || errorDefault.status;
      message = message || code;
    }

    super(message);

    this.code = code;
    this.status = status;
  }
}

export interface ErrorDefault {
  status: number;
  message: string;
}

export const builtInErrorDefaults = {
  UNKNOWN: {
    status: 500,
    message: 'Unknown error',
  },
  INTERNAL_ERROR: {
    status: 500,
    message: 'Internal error',
  },
  PERMISSION_DENIED: {
    status: 403,
    message: 'Permission denied',
  },
  NOT_FOUND: {
    status: 404,
    message: 'Not found',
  },
};

export const errorDefaults: {
  [key: string]: ErrorDefault;
} = builtInErrorDefaults;

/** Error transformer */
export type ErrorTransformer = (reason: any) => any;
