class ApiErrors extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        stack="", // stack trace : gives info about where the error occurred
        errors=[]

    ){
        super(message) // calling parent class constructor
        // setting the new properties
        this.statusCode = statusCode   
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
export default ApiErrors;