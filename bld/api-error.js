var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * APIError class.
 */
var APIError = (function (_super) {
    __extends(APIError, _super);
    function APIError(code, message, status) {
        if (message === void 0) { message = 'Unknown error.'; }
        if (status === void 0) { status = 500; }
        _super.call(this, message);
        this.code = code;
        this.status = status;
    }
    return APIError;
})(Error);
exports.APIError = APIError;
//# sourceMappingURL=api-error.js.map