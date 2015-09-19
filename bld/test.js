require('source-map-support').install();
var Path = require('path');
var FS = require('fs');
var express = require('express');
var Handlebars = require('handlebars');
var Consolidate = require('consolidate');
var HandlebarsLayouts = require('handlebars-layouts');
var vio_1 = require('./vio');
var app = express();
var routesRoot = 'C:\\ZmLearn\\Projects\\www-demo\\bld\\page\\routes';
var viewsRoot = 'C:\\ZmLearn\\Projects\\www-demo\\bld\\page\\views';
var viewParitalsRoot = Path.join(viewsRoot, 'desktop\\partials');
function registerPatials(dir) {
    var names = FS.readdirSync(dir);
    for (var _i = 0; _i < names.length; _i++) {
        var name_1 = names[_i];
        var path = Path.join(dir, name_1);
        var stat = FS.statSync(path);
        if (stat.isDirectory()) {
            registerPatials(path);
        }
        else if (/\.hbs$/.test(name_1)) {
            Handlebars.registerPartial(Path.basename(name_1, '.hbs'), FS.readFileSync(path, 'utf-8'));
            console.log("Registered partial \"" + Path.basename(name_1, '.hbs') + "\".");
        }
    }
}
registerPatials(viewParitalsRoot);
app.engine('hbs', Consolidate.handlebars);
app.set('view engine', 'hbs');
app.set('views', viewsRoot);
HandlebarsLayouts.register(Handlebars);
var router = new vio_1.Router(app, {
    routesRoot: routesRoot,
    viewsRoot: viewsRoot,
    defaultSubsite: 'desktop'
});
app.listen(1337);
//# sourceMappingURL=test.js.map