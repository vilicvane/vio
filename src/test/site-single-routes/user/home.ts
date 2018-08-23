import {Controller, get} from '../../../route';

export default class DefaultController extends Controller {
  content = 'user-home';

  @get()
  default(): object {
    return {
      content: this.content,
    };
  }
}
