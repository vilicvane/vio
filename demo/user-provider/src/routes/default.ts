import { Controller, Request, get } from '../../../../bld';
import { DemoPermission, DemoPermissionDescriptor } from '../modules/user-provider';

export default class Hello extends Controller {
    // http://localhost:1337/
    @get({
        permission: DemoPermissionDescriptor.user
    })
    static default() {
        return {
            title: 'Hello, World!',
            text: 'hello! thank you! thank you very much!'
        };
    }
    
    // http://localhost:1337/
    @get({
        permission: DemoPermissionDescriptor.admin
    })
    static admin() {
        return {
            title: 'Hello, Admin!',
            text: 'hello! thank you! thank you very much!'
        };
    }
}
