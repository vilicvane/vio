import { Controller, Request, APIError, get, post } from '../../../';

export default class extends Controller {
    @get()
    default() {
        return {
            content: 'mobile home'
        };
    }
}
