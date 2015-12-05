import { Controller, Request, APIError, get, post } from '../../../';

export default class extends Controller {
    @get()
    static default() {
        return {
            content: 'desktop home'
        };
    }
    
    @get({
        path: '500'
    })
    static down() {
        throw new Error();
    }
}
