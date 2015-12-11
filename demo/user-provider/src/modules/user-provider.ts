import {
    RequestUser,
    ExpressRequest,
    UserProvider,
    PermissionDescriptor
} from '../../../../bld';

// in this example we simply use plain string to specify a permission.
// in practice it should be something more complex,
// like a combination of roles and privileges. 

export type DemoPermission = string;

export class DemoPermissionDescriptor extends PermissionDescriptor<DemoPermission> {
    constructor(
        public name: DemoPermission
    ) {
        super();
    }
    
    validate(permission: DemoPermission): boolean {
        return permission == this.name;
    }
    
    static user = new DemoPermissionDescriptor('user');
    static admin = new DemoPermissionDescriptor('admin');
}

export class DemoUserProvider implements UserProvider<RequestUser<DemoPermission>> {
    get(req: ExpressRequest): Promise<RequestUser<DemoPermission>> {
        return Promise.resolve({
            permission: 'user'
        });
    }
    
    // method `authenticate` instead of `get` would be invoked
    // if `authentication` in route options is true.
    authenticate(req: ExpressRequest): Promise<RequestUser<DemoPermission>> {
        // do some authentication...
        // let username: string = req.body['username'];
        // let password: string = req.body['password'];
        
        return Promise.resolve({
            permission: 'user'
        });
    }
}
