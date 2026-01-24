const asyncHandler=(fn)=>{
    // returning a new function
   return (req,res,next)=>{
         Promise.resolve(fn(req,res,next)).
         catch((err)=>next(err));
    }  
}
export {asyncHandler}