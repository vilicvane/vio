var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var bld_1 = require('../../../../bld');
var user_provider_1 = require('../modules/user-provider');
var Hello = (function (_super) {
    __extends(Hello, _super);
    function Hello() {
        _super.apply(this, arguments);
    }
    // http://localhost:1337/
    Hello.default = function () {
        return {
            title: 'Hello, World!',
            text: 'hello! thank you! thank you very much!'
        };
    };
    // http://localhost:1337/
    Hello.admin = function () {
        return {
            title: 'Hello, Admin!',
            text: 'hello! thank you! thank you very much!'
        };
    };
    __decorate([
        bld_1.get({
            permission: user_provider_1.DemoPermissionDescriptor.user
        })
    ], Hello, "default", null);
    __decorate([
        bld_1.get({
            permission: user_provider_1.DemoPermissionDescriptor.admin
        })
    ], Hello, "admin", null);
    return Hello;
})(bld_1.Controller);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Hello;
//# sourceMappingURL=default.js.map