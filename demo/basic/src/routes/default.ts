import { RouteGroup, Request, get } from '../../../../bld';

export default class Hello extends RouteGroup {
    // http://localhost:1337/
    @get()
    static default(req: Request) {
        return {
            title: 'Hello, World!',
            text: 'hello! thank you! thank you very much!'
        };
    }
}
