var hyphenate_1 = require('hyphenate');
var hop = Object.prototype.hasOwnProperty;
(function (HttpMethod) {
    HttpMethod[HttpMethod["all"] = 0] = "all";
    HttpMethod[HttpMethod["get"] = 1] = "get";
    HttpMethod[HttpMethod["post"] = 2] = "post";
})(exports.HttpMethod || (exports.HttpMethod = {}));
var HttpMethod = exports.HttpMethod;
var Controller = (function () {
    function Controller() {
    }
    Controller.expire = function () {
        this.expired = true;
        this.options = undefined;
        this.routes = undefined;
    };
    return Controller;
})();
exports.Controller = Controller;
/** @decoraotr */
function route(method, options) {
    return function (GroupClass, name) {
        var handler = GroupClass[name];
        if (!GroupClass.routes) {
            GroupClass.routes = [];
        }
        var methodName;
        if (typeof method === 'string') {
            methodName = method.toLowerCase();
            if (!hop.call(HttpMethod, methodName)) {
                throw new Error("Unsupported HTTP method \"" + method + "\"");
            }
        }
        else {
            methodName = HttpMethod[method];
        }
        var path = options.path;
        if (!path && name !== 'default') {
            path = hyphenate_1.default(name);
        }
        var view = options.view;
        GroupClass.routes.push({
            methodName: methodName,
            path: path,
            view: view,
            handler: handler
        });
    };
}
exports.route = route;
/** @decorator */
function get(options) {
    if (options === void 0) { options = {}; }
    return route(HttpMethod.get, options);
}
exports.get = get;
/** @decorator */
function post(options) {
    if (options === void 0) { options = {}; }
    return route(HttpMethod.post, options);
}
exports.post = post;
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
exports.group = group;
//# sourceMappingURL=route.js.map