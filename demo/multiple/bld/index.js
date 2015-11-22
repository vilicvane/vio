var Path = require('path');
var express = require('express');
var consolidate_1 = require('consolidate');
var bld_1 = require('../../../bld');
var app = express();
app.engine('hbs', consolidate_1.handlebars);
var router = new bld_1.Router(app, {
    routesRoot: Path.join(__dirname, 'routes'),
    viewsRoot: Path.join(__dirname, '../views'),
    defaultSubsite: 'desktop',
    viewsExtension: '.hbs'
});
app.listen(1337);
//# sourceMappingURL=index.js.map