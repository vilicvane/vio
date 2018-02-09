import {Controller, Request, get, post} from '../../';

export default class DefaultController extends Controller {
  @get()
  world() {
    return 'abc';
  }
}
