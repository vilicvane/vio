var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var bld_1 = require('../../../../bld');
var DemoPermissionDescriptor = (function (_super) {
    __extends(DemoPermissionDescriptor, _super);
    function DemoPermissionDescriptor(name) {
        _super.call(this);
        this.name = name;
    }
    DemoPermissionDescriptor.prototype.validate = function (permission) {
        return permission == this.name;
    };
    DemoPermissionDescriptor.user = new DemoPermissionDescriptor('user');
    DemoPermissionDescriptor.admin = new DemoPermissionDescriptor('admin');
    return DemoPermissionDescriptor;
})(bld_1.PermissionDescriptor);
exports.DemoPermissionDescriptor = DemoPermissionDescriptor;
var DemoUserProvider = (function () {
    function DemoUserProvider() {
    }
    DemoUserProvider.prototype.get = function (req) {
        return Promise.resolve({
            permission: 'user'
        });
    };
    // method `authenticate` instead of `get` would be invoked
    // if `authentication` in route options is true.
    DemoUserProvider.prototype.authenticate = function (req) {
        // do some authentication...
        // let username: string = req.body['username'];
        // let password: string = req.body['password'];
        return Promise.resolve({
            permission: 'user'
        });
    };
    return DemoUserProvider;
})();
exports.DemoUserProvider = DemoUserProvider;
//# sourceMappingURL=user-provider.js.map