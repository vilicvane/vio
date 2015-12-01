import { Controller, Request, get, post } from '../../';

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
}
