var Path = require('path');
var express = require('express');
var bld_1 = require('../../../bld');
var app = express();
var router = new bld_1.Router(app, {
    routesRoot: Path.join(__dirname, 'routes'),
    prefix: '/api',
});
app.listen(1337);
//# sourceMappingURL=index.js.map