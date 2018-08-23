import {Controller, get} from '../../../route';

export default class extends Controller {
  @get()
  default(): object {
    return {
      content: 'mobile home',
    };
  }
}
