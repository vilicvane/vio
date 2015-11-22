import * as Path from 'path';

import * as express from 'express';

import { Router } from '../../../bld';

let app = express();

let router = new Router(app, {
    routesRoot: Path.join(__dirname, 'routes'),
    prefix: '/api',
});

app.listen(1337);
