// 用抽象类统一格式和防止typo：继承的每一个error class都需要有statusCode和serializeErrors()
// 抽象类可以被instanceof识别（error handler中），接口不行
export abstract class CustomError extends Error{
    abstract statusCode : number;

    constructor(message: string){
        super(message) // print out the error message in console

        Object.setPrototypeOf(this, CustomError.prototype);
    }
    // unify the return format of errors
    abstract serializeErrors(): { message: string; filed ?: string }[]
}