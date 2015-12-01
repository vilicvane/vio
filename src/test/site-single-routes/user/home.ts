import { Controller, Request, get, post } from '../../../';

export default class DefaultController extends Controller {
    @get()
    static default() {
        return {
            content: 'user-home'
        };
    }
}
