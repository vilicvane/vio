import * as FS from 'fs';
import * as Path from 'path';

import '../../../src/test/modules/bom-test';
import {ExpectedError} from '../../expected-error';
import {
  JSONRedirection,
  JSONResponse,
  Redirection,
  Response,
} from '../../response';
import {
  Controller,
  PermissionDescriptor as PD,
  Request,
  get,
  post,
  route,
} from '../../route';
// Test vio require
import * as Test1 from '../modules/test';
// tslint:disable-next-line:no-duplicate-imports
import * as Test2 from '../modules/test';
import {TestPermissionDescriptor} from '../modules/user-provider';

export default class DefaultController extends Controller {
  @get()
  default(): object {
    return {
      content: 'default',
    };
  }

  @route('get')
  list(): string {
    return 'list';
  }

  @post({
    path: 'u/:user',
  })
  user(req: Request<any>): object {
    return req.params.user;
  }

  @get()
  oops(): void {
    throw new ExpectedError('INTERNAL_ERROR', 'html 500');
  }

  @get()
  ouch(): void {
    throw new ExpectedError('INTERNAL_ERROR_1234' as any);
  }

  @get()
  moduleCache(): boolean {
    return Test1.foo === Test2.foo;
  }

  @get({
    permission: TestPermissionDescriptor.admin,
  })
  permissionDenied(): void {}

  @get({
    permissions: [
      TestPermissionDescriptor.admin,
      TestPermissionDescriptor.user,
    ],
  })
  permissionGranted(): void {}

  @get({
    permission: PD.and(
      TestPermissionDescriptor.admin,
      TestPermissionDescriptor.user,
    ),
  })
  permissionDeniedAnd(): void {}

  @get({
    authentication: true,
    permission: PD.and(
      TestPermissionDescriptor.admin,
      TestPermissionDescriptor.user,
    ),
  })
  permissionGrantedAnd(): void {}

  @get()
  redirect(): Redirection {
    return new Redirection('/');
  }

  @get()
  jsonRedirect(): JSONRedirection {
    return new JSONRedirection('/');
  }

  @get()
  jsonResponse(): JSONResponse<object> {
    return new JSONResponse({
      foo: 'bar',
    });
  }

  @get()
  streamResponse(): Response {
    let path = Path.join(__dirname, '../../../src/test/data/stream.txt');
    let stream = FS.createReadStream(path);

    return new Response('text/html', stream);
  }
}
