"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
// 用抽象类统一格式和防止typo：继承的每一个error class都需要有statusCode和serializeErrors()
// 抽象类可以被instanceof识别（error handler中），接口不行
class CustomError extends Error {
    constructor(message) {
        super(message); // print out the error message in console
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}
exports.CustomError = CustomError;
