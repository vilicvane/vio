# VIO [![Build Status](https://travis-ci.org/vilic/vio.svg)](https://travis-ci.org/vilic/vio)

[![Join the chat at https://gitter.im/vilic/vio](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vilic/vio?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A Router Driven by Express, File Path, Promises, and Decorators.

## Status

Currently in development.

## Features

- Map routes based on file paths.
- Load routes and views dynamically during development.
- Return a promise with data to render the view.
- Use ES7 decorators to specify route handlers.

VIO is developed in [TypeScript](http://www.typescriptlang.org/).
As it's using new ES features, you may need to use compiler or transpiler like TypeScript or [Babel](https://babeljs.io/).

## Install

Install VIO.

```sh
npm install vio --save
```

Install a view engine (here we use `handlebars` with `consolidate`).

```sh
npm install handlebars consolidate --save
```

## Usage

**server.js**

```ts
import * as Path from 'path';

import * as express from 'express';
import { handlebars } from 'consolidate';
import { Router } from 'vio';

let app = express();

app.engine('hbs', handlebars);

let router = new Router(app, {
    routesRoot: Path.join(__dirname, 'routes'),
    viewsRoot: Path.join(__dirname, 'views'),
    viewsExtension: '.hbs'
});

app.listen(1337);
```

**routes/default.js**

```ts
import { Controller, get } from 'vio';

// extends `Controller` class.
export default class DefaultController extends Controller {
    // route as a HTTP GET request.
    @get()
    static default() {
        // can also be a promise if it's async.
        return {
            title: 'Hello, VIO!',
            content: 'Keep calm and read the doc!'
        };
    }
}
```

**views/default.hbs**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
</head>
<body>
    <h1>{{title}}</h1>
    <p>{{content}}</p>
</body>
</html>
```

Now `node server.js` and then visit http://localhost:1337/.

Please checkout the demo folder for more usage. To run a demo:

```sh
# cd to a demo folder.
cd demo/basic

# install dependencies.
npm install

# start node.
node bld/index.js
```

Another minimum demo: https://github.com/vilic/vio-minimum-demo.

## Dynamic Loading

The previous version of VIO is used internally in the passed half a year, having handled more than 100 million page views (though it does not mean you can use this version in production). And the biggest issue this version of VIO wants to take out is slow restarting of node process when something changes. It's not a big deal if the code base is small, but when things grow, it would drive people crazy.

Comparing to other dynamic loading solutions (usually by deleting node requiring cache), VIO take things a little bit further. As routes are file path based (which means no manually mapping needed), VIO guess the possible paths based on requesting url and then load the route file on demand. So creating, moving, deleting files would work without restarting node.

## Route Matching

The route path is a combination of route file path (relative path to `routesRoot`) and route path (implied by route method name using [hyphenate](https://github.com/vilic/hyphenate)).

The last `default` of route file path or route method name, will be ignored. For example:

Route handler `default` defined in `desktop/default.js` file will be matched with route path `/desktop` instead of `/desktop/default` or `/desktop/default/default`.

And if you specified default subsite as `desktop`, it will match both `/` and `/desktop`.

## View Matching

Taking a better editor navigation experience and file structure into consideration, view matching accepts more patterns. For example, route path `/hello/world` would accept view file (take `.hbs` here) at these paths:

- `/hello/world.hbs`
- `/hello/world/default.hbs`
- `/hello/world/default/default.hbs`
- `/hello/world/world.hbs`
- `/hello/world/default/world.hbs`

## Production Mode

Unlike development mode with dynamic loading, production mode loads all routes when process starts and will not care about file changes.

To enable production mode for testing purpose, set environment variable `NODE_ENV` to `production`.

## License

MIT License.
