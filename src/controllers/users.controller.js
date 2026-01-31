import { asyncHandler } from "../utils/asyncHandler.js"

// every controller is a middleware but inverse is not true one more thing is controller is used in last step and all the business related logic is written here it  works in db operations also manipulation of db data and sending responseto the client 
const userRegister=asyncHandler(async(req,res)=>{
      res.status(200).json({
        message:"ok"
      })
})
export {userRegister};