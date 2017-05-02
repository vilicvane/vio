import { Controller, Request, get, post } from '../../../';

export default class DefaultController extends Controller {
    content = 'user-home';

    @get()
    default() {
        return {
            content: this.content
        };
    }
}
