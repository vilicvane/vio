var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream_1 = require('stream');
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
            .type(this.type);
        var content = this.content;
        if (content instanceof stream_1.Readable) {
            content.pipe(res);
        }
        else {
            res.send(content);
        }
    };
    return Response;
})();
exports.Response = Response;
var JSONResponse = (function (_super) {
    __extends(JSONResponse, _super);
    function JSONResponse(data, status) {
        _super.call(this, 'application/json', JSON.stringify(data), status);
    }
    return JSONResponse;
})(Response);
exports.JSONResponse = JSONResponse;
//# sourceMappingURL=response.js.map