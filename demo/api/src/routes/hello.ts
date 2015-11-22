import { Promise } from 'thenfail';

import { RouteGroup, Request, get } from '../../../../bld';

export default class Hello extends RouteGroup {
    // http://localhost:1337/hello/world/abc
    @get({
        path: 'world/:param'
    })
    static world(req: Request) {
        let str: string = req.params['param'];
        str = str.split('').reverse().join('');
        
        return Promise
            .resolve(str)
            .delay(1000);
    }
}
