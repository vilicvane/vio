import {handlebars} from 'consolidate';
import express from 'express';

export function createExpressApp(): express.Express {
  let app = express();

  app.engine('hbs', handlebars);

  return app;
}
