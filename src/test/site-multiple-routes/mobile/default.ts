import { Controller, Request, APIError, get, post } from '../../../';

export default class extends Controller {
    @get()
    static default() {
        return {
            content: 'mobile home'
        };
    }
}
