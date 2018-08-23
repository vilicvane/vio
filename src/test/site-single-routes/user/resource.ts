import {Controller, method} from '../../../route';

export default class extends Controller {
  @method()
  get(): string {
    return 'get';
  }

  @method()
  post(): string {
    return 'post';
  }
}
