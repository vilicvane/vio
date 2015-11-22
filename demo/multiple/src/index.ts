import * as Path from 'path';

import * as express from 'express';
import { handlebars } from 'consolidate';

import { Router } from '../../../bld';

let app = express();

app.engine('hbs', handlebars);

let router = new Router(app, {
    routesRoot: Path.join(__dirname, 'routes'),
    viewsRoot: Path.join(__dirname, '../views'),
    defaultSubsite: 'desktop',
    viewsExtension: '.hbs'
});

app.listen(1337);
