export abstract class CustomError extends Error{
    abstract statusCode : number;

    constructor(message: string){
        super(message) // print out the error message in console

        Object.setPrototypeOf(this, CustomError.prototype);
    }
    // unify the return format of errors
    abstract serializeErrors(): { message: string; filed ?: string }[]
}