// tslint:disable:no-implicit-dependencies

import * as Lodash from 'lodash';

import {ExpressRequest, PermissionDescriptor, UserProvider} from '../../route';

export type TestRoles = string[];

export interface RequestUser<T> {
  permission: T;
}

export class TestPermissionDescriptor extends PermissionDescriptor<TestRoles> {
  constructor(public roles: TestRoles) {
    super();
  }

  validate(roles: TestRoles): boolean {
    return Lodash.difference(this.roles, roles).length === 0;
  }

  static user = new TestPermissionDescriptor(['user']);
  static admin = new TestPermissionDescriptor(['admin']);
}

export class TestUserProvider implements UserProvider<RequestUser<TestRoles>> {
  get(_req: ExpressRequest): Promise<RequestUser<TestRoles>> {
    return Promise.resolve({
      permission: ['user'],
    });
  }

  authenticate(_req: ExpressRequest): Promise<RequestUser<TestRoles>> {
    return Promise.resolve({
      permission: ['user', 'admin'],
    });
  }
}
