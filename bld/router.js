var FS = require('fs');
var Path = require('path');
var glob = require('glob');
var Chalk = require('chalk');
var vioRequire = require('./require')(require);
var express_1 = require('express');
var thenfail_1 = require('thenfail');
var _1 = require('./');
//#endregion
var PRODUCTION = process.env.NODE_ENV === 'production';
var hop = Object.prototype.hasOwnProperty;
var Router = (function () {
    function Router(app, _a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, _c = _b.routesRoot, routesRoot = _c === void 0 ? './routes' : _c, _d = _b.viewsRoot, viewsRoot = _d === void 0 ? './views' : _d, _e = _b.viewsExtension, viewsExtension = _e === void 0 ? '.hbs' : _e, _f = _b.errorViewsFolder, errorViewsFolder = _f === void 0 ? 'error' : _f, defaultSubsite = _b.defaultSubsite, prefix = _b.prefix, _g = _b.json, json = _g === void 0 ? false : _g, _h = _b.production, production = _h === void 0 ? PRODUCTION : _h;
        this.app = app;
        this.routesRoot = Path.resolve(routesRoot);
        this.viewsRoot = Path.resolve(viewsRoot);
        this.errorViewsFolder = errorViewsFolder;
        if (viewsExtension) {
            if (viewsExtension[0] !== '.') {
                viewsExtension = '.' + viewsExtension;
            }
            this.viewsExtension = viewsExtension;
        }
        this.defaultSubsite = defaultSubsite;
        // ensure prefix starts but not ends with '/', i.e. '/prefix'.
        if (prefix) {
            if (prefix !== '/') {
                if (prefix[0] !== '/') {
                    prefix = '/' + prefix;
                }
                if (prefix[prefix.length - 1] === '/') {
                    prefix = prefix.substr(0, prefix.length - 1);
                }
            }
        }
        else {
            prefix = '/';
        }
        this.prefix = prefix;
        this.router = express_1.Router();
        if (production) {
            this.attachRoutes();
        }
        else {
            // this.app.set('view cache', false);
            app.use(prefix, function (req, res, next) {
                _this.attachRoutesDynamically(req.path);
                next();
            });
        }
        app.use(prefix, this.router);
        // handle 404.
        app.use(prefix, function (req, res) { return _this.handleNotFound(req, res); });
    }
    ////////////////
    // PRODUCTION //
    ////////////////
    /**
     * @production
     * Attouch routes synchronously when starting up in production environment.
     */
    Router.prototype.attachRoutes = function () {
        console.log('loading routes...');
        var routeFilePaths = glob.sync('**/*.js', {
            cwd: this.routesRoot
        });
        for (var _i = 0, routeFilePaths_1 = routeFilePaths; _i < routeFilePaths_1.length; _i++) {
            var routeFilePath = routeFilePaths_1[_i];
            this.attachRoutesInFile(routeFilePath);
        }
    };
    /**
     * @production
     */
    Router.prototype.attachRoutesInFile = function (routeFilePath) {
        var modulePath = Path.join(this.routesRoot, routeFilePath);
        // TODO: error handling
        var ControllerClass = require(modulePath).default;
        this.attachRoutesOnController(ControllerClass, routeFilePath);
    };
    /////////////////
    // DEVELOPMENT //
    /////////////////
    /**
     * @development
     * Attach routes dynamicly and synchronously based on request path.
     * Used only at development.
     */
    Router.prototype.attachRoutesDynamically = function (requestPath) {
        console.log('dynamicly loading possible routes...');
        this.replaceRouter();
        var routeGuesses = this.guessRoutes(requestPath);
        for (var _i = 0, routeGuesses_1 = routeGuesses; _i < routeGuesses_1.length; _i++) {
            var routeGuess = routeGuesses_1[_i];
            for (var _a = 0, _b = routeGuess.routeFilePaths; _a < _b.length; _a++) {
                var routeFilePath = _b[_a];
                this.attachRoutesInFileDynamically(routeFilePath);
            }
        }
    };
    /**
     * @development
     */
    Router.prototype.replaceRouter = function () {
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
    };
    /**
     * @development
     */
    Router.prototype.getCompletePathParts = function (requestPath) {
        var pathParts = Router.splitRequestPath(requestPath);
        var firstPathPart = pathParts[0];
        if (!firstPathPart || (firstPathPart !== this.defaultSubsite &&
            !FS.existsSync(Path.join(this.routesRoot, firstPathPart)))) {
            pathParts.unshift(this.defaultSubsite);
        }
        return pathParts;
    };
    /**
     * @development
     */
    Router.prototype.guessRoutes = function (requestPath) {
        var pathParts = this.getCompletePathParts(requestPath);
        var routeGuesses = this.defaultSubsite ? [] : [
            {
                routePath: '',
                lastPart: '',
                routeFilePaths: ['default.js']
            }
        ];
        var lastPossibleRoutePath = '';
        for (var i = 0; i < pathParts.length; i++) {
            var pathPart = pathParts[i];
            lastPossibleRoutePath += '/' + pathPart;
            // if it has default subsite configured, do not search the containing folder.
            var routeFilePaths = i === 0 && this.defaultSubsite ? [
                (lastPossibleRoutePath + "/default.js"),
                (lastPossibleRoutePath + "/" + pathPart + ".js")
            ] : [
                (lastPossibleRoutePath + ".js"),
                (lastPossibleRoutePath + "/default.js"),
                (lastPossibleRoutePath + "/" + pathPart + ".js")
            ];
            routeGuesses.push({
                routePath: lastPossibleRoutePath,
                lastPart: pathPart,
                routeFilePaths: routeFilePaths
            });
        }
        return routeGuesses;
    };
    /**
     * @development
     */
    Router.prototype.attachRoutesInFileDynamically = function (routeFilePath) {
        var resolvedRouteFilePath = Path.join(this.routesRoot, routeFilePath);
        if (!FS.existsSync(resolvedRouteFilePath)) {
            return;
        }
        var ControllerClass;
        try {
            // we use the `exports.default` as the target controller class.
            ControllerClass = vioRequire(resolvedRouteFilePath).default;
        }
        catch (error) {
            console.warn("Failed to load route module \"" + resolvedRouteFilePath + "\".\n" + error.stack);
            return;
        }
        this.attachRoutesOnController(ControllerClass, routeFilePath);
    };
    /**
     * @development
     * Split request path to parts.
     * e.g., "/abc/def/ghi?query=xyz" would be splitted to:
     * ["abc", "def", "ghi"]
     */
    Router.splitRequestPath = function (path) {
        // the empty string matching pattern (after `|`) is to prevent matching from skipping undesired substring.
        // for example, the query string part.
        return Router.splitPath(path, /\/?([^/?]+)|/g);
    };
    ////////////
    // COMMON //
    ////////////
    Router.splitRoutePath = function (path) {
        return Router.splitPath(path, /\/?([^/?*+:]+)|/g);
    };
    Router.splitRouteFilePath = function (path) {
        var parts = path.match(/[^\\/]+/g) || [];
        if (parts.length) {
            var lastIndex = parts.length - 1;
            parts[lastIndex] = parts[lastIndex].replace(/\.js$/gi, '');
        }
        if (parts.length && parts[parts.length - 1] === 'default') {
            parts.pop();
        }
        return parts;
    };
    Router.splitPath = function (path, regex) {
        var part;
        var parts = [];
        while (part = regex.exec(path)[1]) {
            parts.push(part);
        }
        return parts;
    };
    Router.prototype.attachRoutesOnController = function (ControllerClass, routeFilePath) {
        var _this = this;
        var routes = ControllerClass && ControllerClass.routes;
        if (!routes) {
            console.error("module \"" + routeFilePath + "\" does not export a valid controller.");
            return;
        }
        var permissionDescriptors = ControllerClass.permissionDescriptors;
        routes.forEach(function (route, name) {
            if (permissionDescriptors) {
                route.permissionDescriptor = permissionDescriptors.get(name);
            }
            _this.attachSingleRoute(routeFilePath, route);
        });
    };
    Router.prototype.attachSingleRoute = function (routeFilePath, route) {
        route.resolvedView = this.resolveViewPath(routeFilePath, route);
        var router = this.router;
        var methodName = route.methodName;
        var routeHandler = this.createRouteHandler(route);
        var possibleRoutePaths = this.getPossibleRoutePaths(routeFilePath, route.path);
        for (var _i = 0, possibleRoutePaths_1 = possibleRoutePaths; _i < possibleRoutePaths_1.length; _i++) {
            var possibleRoutePath = possibleRoutePaths_1[_i];
            console.log(Chalk.green('*') + " " + possibleRoutePath + " " + Chalk.gray(route.resolvedView ? 'has-view' : 'no-view'));
            router[methodName](possibleRoutePath, routeHandler);
        }
    };
    Router.prototype.createRouteHandler = function (route) {
        var _this = this;
        return function (req, res, next) {
            _this.processRequest(req, res, route, next);
        };
    };
    Router.prototype.getPossibleRoutePaths = function (routeFilePath, routePath) {
        var pathParts = Router.splitRouteFilePath(routeFilePath);
        var firstPart = pathParts.shift();
        // could be undefined if only one part (filename).
        var lastPart = pathParts.pop();
        var possiblePathPartsGroups = [];
        var lastPartToConcat = lastPart ? [lastPart] : [];
        if (firstPart) {
            if (this.defaultSubsite === firstPart) {
                possiblePathPartsGroups.push(pathParts.concat(lastPartToConcat));
            }
            possiblePathPartsGroups.push([firstPart].concat(pathParts, lastPartToConcat));
        }
        else if (!this.defaultSubsite) {
            // `firstPart` is undefined means `pathParts` has 0 length.
            possiblePathPartsGroups.push(lastPartToConcat);
        }
        else {
            console.warn("Routes in file \"" + routeFilePath + "\" will not be attached as default subsite is configured.");
        }
        return possiblePathPartsGroups.map(function (parts) {
            if (routePath) {
                if (routePath[0] === '/') {
                    if (routePath.length > 1) {
                        parts.push(routePath.slice(1));
                    }
                }
                else {
                    parts.push(routePath);
                }
            }
            return '/' + parts.join('/');
        });
    };
    Router.prototype.resolveViewPath = function (routeFilePath, route) {
        if (route.view) {
            return Path.join(this.viewsRoot, route.view);
        }
        if (!this.viewsExtension) {
            return undefined;
        }
        var possibleViewPaths = this.getPossibleViewPaths(routeFilePath, route.path);
        for (var _i = 0, possibleViewPaths_1 = possibleViewPaths; _i < possibleViewPaths_1.length; _i++) {
            var possibleViewPath = possibleViewPaths_1[_i];
            if (FS.existsSync(possibleViewPath)) {
                return possibleViewPath;
            }
        }
        return undefined;
    };
    Router.prototype.getPossibleViewPaths = function (routeFilePath, routePath) {
        var pathParts = Router.splitRouteFilePath(routeFilePath);
        if (routePath) {
            pathParts.push.apply(pathParts, Router.splitRoutePath(routePath));
        }
        var viewSearchPath = Path.join.apply(Path, [this.viewsRoot].concat(pathParts));
        var possibleViewPaths = [];
        if (pathParts.length) {
            possibleViewPaths.push(viewSearchPath + this.viewsExtension);
        }
        possibleViewPaths.push.apply(possibleViewPaths, [
            Path.join(viewSearchPath, 'default' + this.viewsExtension),
            Path.join(viewSearchPath, 'default', 'default' + this.viewsExtension)
        ]);
        if (pathParts.length) {
            var lastPart = pathParts[pathParts.length - 1];
            possibleViewPaths.push.apply(possibleViewPaths, [
                Path.join(viewSearchPath, lastPart + this.viewsExtension),
                Path.join(viewSearchPath, 'default', lastPart + this.viewsExtension)
            ]);
        }
        return possibleViewPaths;
    };
    Router.prototype.processRequest = function (req, res, route, next) {
        var _this = this;
        thenfail_1.Promise
            .then(function () {
            if (_this.userProvider) {
                if (route.authentication) {
                    return _this.userProvider.authenticate(req);
                }
                else {
                    return _this.userProvider.get(req);
                }
            }
            else {
                return undefined;
            }
        })
            .then(function (user) {
            var permissionDescriptor = route.permissionDescriptor;
            if (permissionDescriptor &&
                !permissionDescriptor.validate(user && user.permission)) {
                throw new _1.APIError(_1.APIErrorCode.permissionDenied, 'Permission denied', 403);
            }
            req.user = user;
        })
            .then(function () { return route.handler(req, res); })
            .then(function (result) {
            if (res.headersSent) {
                if (result) {
                    console.warn("Header has already been sent, but the route handler returns a non-null value.\n" + route.handler.toString());
                }
                return;
            }
            // Handle specified response.
            if (result instanceof _1.Response) {
                result.sendTo(res);
            }
            else if (route.resolvedView) {
                return new thenfail_1.Promise(function (resolve, reject) {
                    res.render(route.resolvedView, result, function (error, html) {
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
                res.json({
                    data: result
                });
            }
        })
            .fail(function (reason) {
            var apiError;
            if (_this.errorTransformer) {
                apiError = _this.errorTransformer(reason) || new _1.APIError(-1);
            }
            else if (reason instanceof _1.APIError) {
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
        var viewPath = this.findErrorPageViewPath(req.path, status);
        if (viewPath) {
            res.render(viewPath, {
                url: req.url,
                status: status
            });
        }
        else {
            // TODO: some beautiful default error pages.
            var defaultMessage = status === 404 ?
                "Page not found.<br />\nKeep calm and read the doc <a href=\"https://github.com/vilic/vio\">https://github.com/vilic/vio</a>." :
                "Something wrong happened (" + status + ").<br />\nKeep calm and read the doc <a href=\"https://github.com/vilic/vio\">https://github.com/vilic/vio</a>.";
            res
                .type('text/html')
                .send(defaultMessage);
        }
    };
    Router.prototype.findErrorPageViewPath = function (requestPath, status) {
        var statusStr = status.toString();
        var subsiteName = this.getSubsiteName(requestPath) || '';
        var possibleFileNames = [
            statusStr + this.viewsExtension,
            statusStr.substr(0, 2) + 'x' + this.viewsExtension,
            statusStr.substr(0, 1) + 'xx' + this.viewsExtension
        ];
        for (var _i = 0, possibleFileNames_1 = possibleFileNames; _i < possibleFileNames_1.length; _i++) {
            var fileName = possibleFileNames_1[_i];
            var viewPath = Path.resolve(this.viewsRoot, subsiteName, this.errorViewsFolder, fileName);
            if (FS.existsSync(viewPath)) {
                return viewPath;
            }
        }
        return undefined;
    };
    Router.prototype.getSubsiteName = function (requestPath) {
        var part = /\/[^/?]+|/.exec(requestPath)[0];
        if (part) {
            var subsiteDir = Path.join(this.routesRoot, part);
            // cache in production mode
            if (FS.existsSync(subsiteDir)) {
                return part.substr(1);
            }
        }
        return this.defaultSubsite;
    };
    return Router;
})();
exports.Router = Router;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Router;
//# sourceMappingURL=router.js.map