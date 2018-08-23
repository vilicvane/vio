import {Controller, get} from '../../route';

export default class DefaultController extends Controller {
  @get()
  world(): string {
    return 'abc';
  }
}
