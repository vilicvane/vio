import { Promise } from 'thenfail';

import { Controller, Request, get } from '../../../../bld';

export default class Hello extends Controller {
    // http://localhost:1337/api/hello/world/abc
    @get({
        path: 'world/:param'
    })
    static world(req: Request<any>) {
        let str: string = req.params['param'];
        str = str.split('').reverse().join('');
        
        return Promise
            .resolve(str)
            .delay(1000);
    }
}
