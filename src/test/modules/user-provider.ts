import * as Lodash from 'lodash';

import {
    RequestUser,
    ExpressRequest,
    UserProvider,
    PermissionDescriptor
} from '../../';

export type TestRoles = string[];

export class TestPermissionDescriptor extends PermissionDescriptor<TestRoles> {
    constructor(
        public roles: TestRoles
    ) {
        super();
    }
    
    validate(roles: TestRoles): boolean {
        return Lodash.difference(this.roles, roles).length === 0;
    }
    
    static user = new TestPermissionDescriptor(['user']);
    static admin = new TestPermissionDescriptor(['admin']);
}

export class TestUserProvider implements UserProvider<RequestUser<TestRoles>> {
    get(req: ExpressRequest): Promise<RequestUser<TestRoles>> {
        return Promise.resolve({
            permission: ['user']
        });
    }
    
    authenticate(req: ExpressRequest): Promise<RequestUser<TestRoles>> {
        return Promise.resolve({
            permission: ['user', 'admin']
        });
    }
}
