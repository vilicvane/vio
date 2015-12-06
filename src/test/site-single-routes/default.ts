import * as FS from 'fs';
import * as Path from 'path';

import {
    Controller,
    Request,
    APIError,
    PermissionDescriptor as PD,
    Redirection,
    JSONRedirection,
    JSONResponse,
    Response,
    get,
    post,
    route
} from '../../';

import { TestPermissionDescriptor, TestRoles } from '../modules/user-provider';

// test vio require
import * as Test1 from '../modules/test';
import * as Test2 from '../modules/test';

import '../../../src/test/modules/bom-test';

export default class DefaultController extends Controller {
    @get()
    static default() {
        return {
            content: 'default'
        };
    }
    
    @route('get')
    static list() {
        return 'list';
    }
    
    @post({
        path: 'u/:user'
    })
    static user(req: Request<any>) {
        return req.params['user'];
    }
    
    @get()
    static oops() {
        throw new APIError(0, 'html 500');
    }
    
    @get()
    static ouch() {
        throw new APIError(1234);
    }
    
    @get()
    static moduleCache() {
        return Test1.foo === Test2.foo;
    }
    
    @get({
        permission: TestPermissionDescriptor.admin
    })
    static permissionDenied() { }
    
    @get({
        permissions: [TestPermissionDescriptor.admin, TestPermissionDescriptor.user]
    })
    static permissionGranted() { }
    
    @get({
        permission: PD.and(TestPermissionDescriptor.admin, TestPermissionDescriptor.user)
    })
    static permissionDeniedAnd() { }
    
    @get({
        authentication: true,
        permission: PD.and(TestPermissionDescriptor.admin, TestPermissionDescriptor.user)
    })
    static permissionGrantedAnd() { }
    
    @get()
    static redirect() {
        return new Redirection('/');
    }
    
    @get()
    static jsonRedirect() {
        return new JSONRedirection('/');
    }
    
    @get()
    static jsonResponse() {
        return new JSONResponse({
            foo: 'bar'
        });
    }
    
    @get()
    static streamResponse() {
        let path = Path.join(__dirname, '../../../src/test/data/stream.txt');
        let stream = FS.createReadStream(path);
        
        return new Response('text/html', stream);
    }
}
