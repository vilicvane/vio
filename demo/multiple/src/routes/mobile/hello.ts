import { RouteGroup, Request, get } from '../../../../../bld';

export default class Hello extends RouteGroup {
    // http://localhost:1337/mobile/hello/world/abc
    @get({
        path: 'world/:param?'
    })
    static world(req: Request) {
        return {
            title: 'Hello, World!',
            text: 'hello! thank you! thank you very much!',
            param: req.params['param'] || 'empty'
        };
    }
}
