import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";
export const verifyJwt=asyncHandler(async(req,_,next)=>{
        
   
   try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
         
      if(!token) {
          throw new ApiError(401,"unauthorized request");
      }
      
     const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
     const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
     // situation where user is deleted but token is valid 
     if(!user){
       throw new ApiError(401,"Invalid Access Token")
     }
     req.user=user; // attach the user to the request object so that next middleware or controller can use it
    console.log("decoded token in auth middleware:",decodedToken)
     next();  
   } catch (error) {
     throw new ApiError(401,"Invalid or Expired Access Token")
   } 
})
// jwt.verify() rejects expired tokens; if (!user) protects against valid tokens belonging to deleted or invalid users.
// jwt.verify does 2 things 1.verify the token is valid or not 2.decode the token if valid then it return the decoded payload (object with) else throws an error
      
       // there is now two cases 1.token is valid 2.token is expired