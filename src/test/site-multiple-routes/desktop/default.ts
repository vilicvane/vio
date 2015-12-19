import { Controller, Request, APIError, get, post } from '../../../';

export default class extends Controller {
    @get()
    default() {
        return {
            content: 'desktop home'
        };
    }
    
    @get({
        path: '500'
    })
    down() {
        throw new Error();
    }
}
