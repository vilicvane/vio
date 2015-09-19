var hop = Object.prototype.hasOwnProperty;
(function (Method) {
    Method[Method["ALL"] = 0] = "ALL";
    Method[Method["GET"] = 1] = "GET";
    Method[Method["POST"] = 2] = "POST";
})(exports.Method || (exports.Method = {}));
var Method = exports.Method;
var Group = (function () {
    function Group() {
    }
    Group.expire = function () {
        this.expired = true;
        this.options = undefined;
        this.routes = undefined;
    };
    return Group;
})();
exports.Group = Group;
//# sourceMappingURL=route.js.map