var FS = require('fs');
var Path = require('path');
var express_1 = require('express');
var thenfail_1 = require('thenfail');
var route_1 = require('./route');
var response_1 = require('./response');
var api_error_1 = require('./api-error');
//#endregion
var PRODUCTION = !!process.env.PRODUCTION;
var hop = Object.prototype.hasOwnProperty;
var Router = (function () {
    function Router(app, _a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, _c = _b.routesRoot, routesRoot = _c === void 0 ? './routes' : _c, _d = _b.viewsRoot, viewsRoot = _d === void 0 ? './views' : _d, _e = _b.viewsExtension, viewsExtension = _e === void 0 ? '.hbs' : _e, _f = _b.errorViewsFolder, errorViewsFolder = _f === void 0 ? 'error' : _f, defaultSubsite = _b.defaultSubsite, prefix = _b.prefix, _g = _b.json, json = _g === void 0 ? false : _g;
        this.app = app;
        // Ensure root path ends without '/' or '\\'.
        routesRoot = routesRoot.replace(/[/\\]$/, '');
        viewsRoot = viewsRoot.replace(/[/\\]$/, '');
        this.routesRoot = routesRoot;
        this.viewsRoot = viewsRoot;
        this.errorViewsFolder = errorViewsFolder;
        this.viewsExtension = viewsExtension;
        this.defaultSubsite = defaultSubsite;
        this.defaultAsJSON = json;
        var prefixUsePath;
        // Ensure prefix starts but not ends with '/', i.e. '/prefix'.
        if (prefix && prefix !== '/') {
            if (prefix[0] !== '/') {
                prefix = '/' + prefix;
            }
            if (prefix[prefix.length - 1] === '/') {
                prefix = prefix.substr(0, prefix.length - 1);
            }
            this.prefix = prefix;
            prefixUsePath = prefix;
        }
        else {
            prefix = undefined;
            prefixUsePath = '/';
        }
        this.router = express_1.Router();
        if (PRODUCTION) {
        }
        else {
            // this.app.set('view cache', false);
            app.use(prefixUsePath, function (req, res, next) {
                _this.attachRoutesDynamicly(req.path);
                next();
            });
        }
        app.use(prefixUsePath, this.router);
        // Handle 404.
        app.use(prefixUsePath, function (req, res) { return _this.handleNotFound(req, res); });
    }
    /**
     * Attach route dynamicly based on requesting path.
     * Used only at development.
     */
    Router.prototype.attachRoutesDynamicly = function (requestingPath) {
        var router = express_1.Router();
        var previousRouter = this.router;
        this.router = router;
        var expressRouterStack = this.app._router.stack;
        for (var i = 0; i < expressRouterStack.length; i++) {
            if (expressRouterStack[i].handle === previousRouter) {
                expressRouterStack[i].handle = router;
                break;
            }
        }
        // Split requesting path to parts.
        // E.g., "/abc/def/ghi?query=xyz" would be splitted to:
        // ["/abc", "/def", "/ghi"]
        var pathRegex = /\/[^/?]+|/g;
        var lastPossibleRouteModulePath = '';
        var pathPart;
        var pathParts = [];
        while (pathPart = pathRegex.exec(requestingPath)[0]) {
            pathParts.push(pathPart);
        }
        var firstPathPart = pathParts[0];
        var isDefaultSubsite;
        if (this.defaultSubsite) {
            if (firstPathPart && firstPathPart.substr(1) === this.defaultSubsite) {
                isDefaultSubsite = true;
            }
            else if (!firstPathPart || (firstPathPart.substr(1) !== this.defaultSubsite &&
                !FS.existsSync(Path.join(this.routesRoot, firstPathPart)))) {
                isDefaultSubsite = true;
                firstPathPart = '/' + this.defaultSubsite;
                pathParts.unshift(firstPathPart);
            }
            else {
                isDefaultSubsite = false;
            }
        }
        else {
            isDefaultSubsite = false;
        }
        var routeGuesses = this.defaultSubsite ? [] : [
            {
                path: '',
                lastPart: '',
                modulePaths: ['/default.js']
            }
        ];
        for (var i = 0; i < pathParts.length; i++) {
            pathPart = pathParts[i];
            lastPossibleRouteModulePath += pathPart;
            // If it has defaultSubsite configured, do not search the containing folder.
            var modulePaths = i === 0 && this.defaultSubsite ? [
                (lastPossibleRouteModulePath + "/default.js"),
                ("" + lastPossibleRouteModulePath + pathPart + ".js")
            ] : [
                (lastPossibleRouteModulePath + ".js"),
                (lastPossibleRouteModulePath + "/default.js"),
                ("" + lastPossibleRouteModulePath + pathPart + ".js")
            ];
            routeGuesses.push({
                path: lastPossibleRouteModulePath,
                lastPart: pathPart,
                modulePaths: modulePaths
            });
        }
        for (var _i = 0; _i < routeGuesses.length; _i++) {
            var routeGuess = routeGuesses[_i];
            for (var _a = 0, _b = routeGuess.modulePaths; _a < _b.length; _a++) {
                var modulePath = _b[_a];
                modulePath = Path.join(this.routesRoot, modulePath);
                if (!FS.existsSync(modulePath)) {
                    continue;
                }
                var GroupClass = void 0;
                try {
                    var resolvedPossiblePath = require.resolve(modulePath);
                    var lastModified = FS.statSync(resolvedPossiblePath).mtime.getTime();
                    if (resolvedPossiblePath in Router.lastModifiedMap) {
                        if (Router.lastModifiedMap[resolvedPossiblePath] !== lastModified) {
                            // Avoid cache.
                            delete require.cache[resolvedPossiblePath];
                            Router.lastModifiedMap[resolvedPossiblePath] = lastModified;
                        }
                    }
                    else {
                        Router.lastModifiedMap[resolvedPossiblePath] = lastModified;
                    }
                    // We use the `exports.default` as the target `GroupClass`.
                    GroupClass = require(modulePath)['default'];
                }
                catch (e) {
                    console.warn("Failed to load route module \"" + modulePath + "\".");
                    continue;
                }
                var routes = GroupClass && GroupClass.routes;
                if (!routes) {
                    console.warn("No `GroupClass` or valid `GroupClass` found under `exports.default` in route module \"" + modulePath + "\".");
                    continue;
                }
                for (var _c = 0; _c < routes.length; _c++) {
                    var route = routes[_c];
                    var method = route.method;
                    var path = routeGuess.path + (route.path ? '/' + route.path : '');
                    if (route.view) {
                        var specifiedViewPath = Path.resolve(this.viewsRoot, route.view);
                        route.view = specifiedViewPath;
                    }
                    else if (!this.defaultAsJSON) {
                        var viewSearchPath = Path.join(this.viewsRoot, routeGuess.path);
                        var possibleViewPaths = route.path ? [
                            Path.join(viewSearchPath, route.path + this.viewsExtension),
                            Path.join(viewSearchPath, route.path, 'default' + this.viewsExtension),
                            Path.join(viewSearchPath, route.path, 'default/default' + this.viewsExtension),
                            // Use `Path.basename` in case of route path like `ghi/jkl`.
                            Path.join(viewSearchPath, route.path, Path.basename(route.path) + this.viewsExtension)
                        ] : routeGuess.lastPart ? [
                            viewSearchPath + this.viewsExtension,
                            Path.join(viewSearchPath, 'default' + this.viewsExtension),
                            Path.join(viewSearchPath, 'default/default' + this.viewsExtension),
                            Path.join(viewSearchPath, routeGuess.lastPart + this.viewsExtension)
                        ] : [
                            viewSearchPath + this.viewsExtension,
                            Path.join(viewSearchPath, 'default' + this.viewsExtension),
                            Path.join(viewSearchPath, 'default/default' + this.viewsExtension)
                        ];
                        for (var _d = 0; _d < possibleViewPaths.length; _d++) {
                            var possibleViewPath = possibleViewPaths[_d];
                            if (FS.existsSync(possibleViewPath)) {
                                console.log("Found view file:\n    \"" + possibleViewPath + "\".");
                                route.view = possibleViewPath;
                                break;
                            }
                        }
                        if (!route.view) {
                            console.warn("Found none of these view files for route \"" + path + "\":\n    " + possibleViewPaths.join('\n    '));
                        }
                    }
                    var routeHandler = this.createRouteHandler(route);
                    router[method](path, routeHandler);
                    if (isDefaultSubsite) {
                        router[method](path.substr(firstPathPart.length), routeHandler);
                    }
                }
            }
        }
    };
    Router.prototype.getSubsiteName = function (path) {
        var part = /\/[^/?]+|/.exec(path)[0];
        if (part) {
            var subsiteDir = Path.join(this.routesRoot, part);
            if (FS.existsSync(subsiteDir)) {
                return part.substr(1);
            }
        }
        return this.defaultSubsite;
    };
    Router.prototype.processRequest = function (req, res, route, next) {
        var _this = this;
        thenfail_1.Promise
            .then(function () { })
            .then(function () { return route.handler(req, res); })
            .then(function (result) {
            if (res.headersSent) {
                if (result) {
                    console.warn("Header has already been sent, but the route handler returns a non-null value.\n" + route.handler.toString());
                }
                return;
            }
            // Handle specified response.
            if (result instanceof response_1.Response) {
                result.sendTo(res);
            }
            else if (_this.defaultAsJSON) {
                res.json({
                    data: result
                });
            }
            else if (route.view) {
                return new thenfail_1.Promise(function (resolve, reject) {
                    res.render(route.view, result, function (error, html) {
                        if (error) {
                            reject(error);
                        }
                        else {
                            res.send(html);
                            resolve();
                        }
                    });
                });
            }
            else {
                throw new Error('Missing view file.');
            }
        })
            .fail(function (reason) {
            var apiError;
            if (_this.errorTransformer) {
                apiError = _this.errorTransformer(reason) || new api_error_1.APIError(-1);
            }
            else if (reason instanceof api_error_1.APIError) {
                apiError = reason;
            }
            if (!res.headersSent) {
                _this.handleServerError(req, res, apiError && apiError.status);
            }
            if (!apiError) {
                throw reason;
            }
        })
            .log();
        // .done();
    };
    Router.prototype.handleNotFound = function (req, res) {
        this.renderErrorPage(req, res, 404);
    };
    Router.prototype.handleServerError = function (req, res, status) {
        if (status === void 0) { status = 500; }
        this.renderErrorPage(req, res, status);
    };
    Router.prototype.renderErrorPage = function (req, res, status) {
        res.status(status);
        var statusStr = status.toString();
        var subsiteName = this.getSubsiteName(req.path) || '';
        var possibleFileNames = [
            statusStr + this.viewsExtension,
            statusStr.substr(0, 2) + 'x' + this.viewsExtension,
            statusStr.substr(0, 1) + 'xx' + this.viewsExtension
        ];
        for (var _i = 0; _i < possibleFileNames.length; _i++) {
            var fileName = possibleFileNames[_i];
            var viewPath = Path.join(this.viewsRoot, subsiteName, this.errorViewsFolder, fileName);
            if (FS.existsSync(viewPath)) {
                res.render(viewPath, {
                    url: req.url,
                    status: status
                });
                return;
            }
        }
        var defaultMessage = status === 404 ?
            "Page not found.<br />\nKeep calm and visit <a href=\"https://vane.life/\">https://vane.life/</a>." :
            "Something happened (" + status + ").<br />\nKeep calm and visit <a href=\"https://vane.life/\">https://vane.life/</a>.";
        res
            .type('text/html')
            .send(defaultMessage);
    };
    Router.prototype.createRouteHandler = function (route) {
        var _this = this;
        return function (req, res, next) {
            _this.processRequest(req, res, route, next);
        };
    };
    /**
     * Transform identifier name like:
     * 1. "helloWorld" to "hello-world",
     * 2. "parseJSONString" to "parse-json-string".
     */
    Router.getPathPartByIdentifierName = function (identifierName) {
        var upperCaseRegex = /[A-Z]+(?=[A-Z][a-z]|$)|[A-Z]/g;
        return identifierName.replace(upperCaseRegex, function (m, index) {
            return (index ? '-' : '') + m.toLowerCase();
        });
    };
    /** A map of route file last modified timestamp. */
    Router.lastModifiedMap = {};
    return Router;
})();
exports.Router = Router;
var Router;
(function (Router) {
    /** @decoraotr */
    function route(options) {
        return function (GroupClass, name) {
            var handler = GroupClass[name];
            if (!GroupClass.routes) {
                GroupClass.routes = [];
            }
            var method = (route_1.Method[options.method] || 'all').toLowerCase();
            var path = options.path;
            if (!path && name !== 'default') {
                path = Router.getPathPartByIdentifierName(name);
            }
            var view = options.view;
            GroupClass.routes.push({
                method: method,
                path: path,
                view: view,
                handler: handler
            });
        };
    }
    Router.route = route;
    /** @decorator */
    function GET(options) {
        if (options === void 0) { options = {}; }
        options.method = route_1.Method.GET;
        return route(options);
    }
    Router.GET = GET;
    /** @decorator */
    function POST(options) {
        if (options === void 0) { options = {}; }
        options.method = route_1.Method.POST;
        return route(options);
    }
    Router.POST = POST;
    /** @decorator */
    function group(options) {
        if (options === void 0) { options = {}; }
        return function (GroupClass) {
            // let {
            //     
            // } = options;
            // 
            // GroupClass.options = {
            //     
            // };
        };
    }
    Router.group = group;
})(Router = exports.Router || (exports.Router = {}));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Router;
//# sourceMappingURL=router.js.map