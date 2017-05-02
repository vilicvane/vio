import { Controller, get } from '../../../';

export default class extends Controller {
  @get()
  default() {
    return {
      content: 'mobile home',
    };
  }
}
