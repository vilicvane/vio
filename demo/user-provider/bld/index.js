var Path = require('path');
var express = require('express');
var consolidate_1 = require('consolidate');
var bld_1 = require('../../../bld');
var user_provider_1 = require('./modules/user-provider');
var app = express();
app.engine('hbs', consolidate_1.handlebars);
var router = new bld_1.Router(app, {
    routesRoot: Path.join(__dirname, 'routes'),
    viewsRoot: Path.join(__dirname, '../views'),
    viewsExtension: '.hbs'
});
// set up user provider.
router.userProvider = new user_provider_1.DemoUserProvider();
app.listen(1337);
//# sourceMappingURL=index.js.map