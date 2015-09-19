require('source-map-support').install();

import * as Path from 'path';
import * as FS from 'fs';

import * as express from 'express';

var Handlebars = require('handlebars');
var Consolidate = require('consolidate');
var HandlebarsLayouts = require('handlebars-layouts');

import { Promise } from 'thenfail';

import { Router } from './vio';

let app = express();

let routesRoot = 'C:\\ZmLearn\\Projects\\www-demo\\bld\\page\\routes';
let viewsRoot = 'C:\\ZmLearn\\Projects\\www-demo\\bld\\page\\views';
let viewParitalsRoot = Path.join(viewsRoot, 'desktop\\partials');

function registerPatials(dir: string): void {
    let names = FS.readdirSync(dir);
    
    for (let name of names) {
        let path = Path.join(dir, name);
        let stat = FS.statSync(path);
        
        if (stat.isDirectory()) {
            registerPatials(path);
        } else if (/\.hbs$/.test(name)) {
            Handlebars.registerPartial(Path.basename(name, '.hbs'), FS.readFileSync(path, 'utf-8'));
            console.log(`Registered partial "${Path.basename(name, '.hbs')}".`);
        }
    }
}

registerPatials(viewParitalsRoot);

app.engine('hbs', Consolidate.handlebars);
app.set('view engine', 'hbs');
app.set('views', viewsRoot);

HandlebarsLayouts.register(Handlebars);

let router = new Router(app, {
    routesRoot,
    viewsRoot,
    defaultSubsite: 'desktop'
});

app.listen(1337);
