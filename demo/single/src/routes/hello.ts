import { Controller, Request, get } from '../../../../bld';

export default class Hello extends Controller {
    // http://localhost:1337/hello/world/abc
    @get({
        path: 'world/:param?'
    })
    static world(req: Request<any>) {
        return {
            title: 'Hello, World!',
            text: 'hello! thank you! thank you very much!',
            param: req.params['param'] || 'empty'
        };
    }
}
