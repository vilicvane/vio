import * as Path from 'path';

import * as express from 'express';
import { handlebars } from 'consolidate';

import { Router } from '../../../bld';

import { DemoUserProvider } from './modules/user-provider';

let app = express();

app.engine('hbs', handlebars);

let router = new Router(app, {
    routesRoot: Path.join(__dirname, 'routes'),
    viewsRoot: Path.join(__dirname, '../views'),
    viewsExtension: '.hbs'
});

// set up user provider.
router.userProvider = new DemoUserProvider();

app.listen(1337);
