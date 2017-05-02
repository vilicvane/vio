import * as express from 'express';
import { handlebars } from 'consolidate';

export function createExpressApp(): express.Express {
  let app = express();

  app.engine('hbs', handlebars);

  return app;
}
