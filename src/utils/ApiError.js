class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors = [] , // stack trace : gives info about where the error occurred
        stack=""

    ){
        super(message) // calling parent class constructor
        // setting the new properties
        this.statusCode = statusCode  
        this.data=null 
        this.message=message  
        this.success=false 
        this.errors = errors
        if(stack){
            this.stack = stack;
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export default ApiError;