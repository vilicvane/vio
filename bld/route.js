var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
    Controller.permissionDescriptors = new Map();
    Controller.routes = new Map();
    return Controller;
})();
exports.Controller = Controller;
/** @decoraotr */
function route(method, options) {
    return function (ControllerClass, name) {
        var handler = ControllerClass[name].bind(ControllerClass);
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
        var path = options.path, view = options.view, _a = options.authentication, authentication = _a === void 0 ? false : _a;
        if (!path && name !== 'default') {
            path = hyphenate_1.default(name);
        }
        ControllerClass.routes.set(name, {
            methodName: methodName,
            path: path,
            view: view,
            handler: handler,
            authentication: authentication
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
function controller(options) {
    if (options === void 0) { options = {}; }
    return function (ControllerClass) {
        // ...
    };
}
exports.controller = controller;
var PermissionDescriptor = (function () {
    function PermissionDescriptor() {
    }
    PermissionDescriptor.or = function () {
        var permissions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            permissions[_i - 0] = arguments[_i];
        }
        return new CompoundOrPermissionDescriptor(permissions);
    };
    PermissionDescriptor.and = function () {
        var permissions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            permissions[_i - 0] = arguments[_i];
        }
        return new CompoundAndPermissionDescriptor(permissions);
    };
    return PermissionDescriptor;
})();
exports.PermissionDescriptor = PermissionDescriptor;
var CompoundOrPermissionDescriptor = (function (_super) {
    __extends(CompoundOrPermissionDescriptor, _super);
    function CompoundOrPermissionDescriptor(descriptors) {
        _super.call(this);
        this.descriptors = descriptors;
    }
    CompoundOrPermissionDescriptor.prototype.validate = function (permission) {
        for (var _i = 0, _a = this.descriptors; _i < _a.length; _i++) {
            var descriptor = _a[_i];
            if (descriptor.validate(permission)) {
                return true;
            }
        }
        return false;
    };
    return CompoundOrPermissionDescriptor;
})(PermissionDescriptor);
exports.CompoundOrPermissionDescriptor = CompoundOrPermissionDescriptor;
var CompoundAndPermissionDescriptor = (function (_super) {
    __extends(CompoundAndPermissionDescriptor, _super);
    function CompoundAndPermissionDescriptor(descriptors) {
        _super.call(this);
        this.descriptors = descriptors;
    }
    CompoundAndPermissionDescriptor.prototype.validate = function (permission) {
        for (var _i = 0, _a = this.descriptors; _i < _a.length; _i++) {
            var descriptor = _a[_i];
            if (!descriptor.validate(permission)) {
                return false;
            }
        }
        return true;
    };
    return CompoundAndPermissionDescriptor;
})(PermissionDescriptor);
exports.CompoundAndPermissionDescriptor = CompoundAndPermissionDescriptor;
/** @decoraotr */
function permission() {
    var descriptors = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        descriptors[_i - 0] = arguments[_i];
    }
    var descriptor = descriptors.length === 1 ?
        descriptors[0] :
        new CompoundOrPermissionDescriptor(descriptors);
    return function (ControllerClass, name) {
        ControllerClass.permissionDescriptors.set(name, descriptor);
    };
}
exports.permission = permission;
//# sourceMappingURL=route.js.map