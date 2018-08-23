import {Controller, get} from '../../../route';

export default class extends Controller {
  @get()
  default(): object {
    return {
      content: 'desktop home',
    };
  }

  @get({
    path: '500',
  })
  down(): void {
    throw new Error();
  }
}
