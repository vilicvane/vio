import { Controller, method } from '../../../';

export default class extends Controller {
    @method()
    get() {
        return 'get';
    }

    @method()
    post() {
        return 'post';
    }
}
