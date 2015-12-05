// test vio require
import 'path';

import * as Test1 from '../modules/test';
import * as Test2 from '../modules/test';

import '../../../src/test/modules/bom-test';

import { Controller, Request, APIError, get, post } from '../../';

export default class DefaultController extends Controller {
    @get()
    static default() {
        return {
            content: 'default'
        };
    }
    
    @get()
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
}
