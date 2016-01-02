import { Controller, get } from '../../../';

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
