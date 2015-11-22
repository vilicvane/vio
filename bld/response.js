var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Response = (function () {
    function Response(type, content, status) {
        if (status === void 0) { status = 200; }
        this.type = type;
        this.content = content;
        this.status = status;
    }
    Response.prototype.sendTo = function (res) {
        res
            .status(this.status)
            .type(this.type)
            .send(this.content);
    };
    return Response;
})();
exports.Response = Response;
var JSONResponse = (function (_super) {
    __extends(JSONResponse, _super);
    function JSONResponse(data, status) {
        if (status === void 0) { status = 200; }
        _super.call(this, 'application/json', JSON.stringify(data), status);
    }
    return JSONResponse;
})(Response);
exports.JSONResponse = JSONResponse;
//# sourceMappingURL=response.js.map