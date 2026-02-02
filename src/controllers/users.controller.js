import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { uploadOncloudinary } from "../utils/cloudinaryservice.js"
import {User} from "../models/user.model.js"
import ApiResponse from "../utils/ApiResponse.js"
import mongoose from "mongoose"
// every controller is a middleware but inverse is not true one more thing is controller is used in last step and all the business related logic is written here it  works in db operations also manipulation of db data and sending responseto the client 
const userRegister=asyncHandler(async(req,res)=>{
    
  // get the user data from frontend using req.body if data is sent through body (json or form data)
       const {userName, email, fullName, password } = req.body
     console.log(req.body)
     console.log(req.files)
    //  check the validation of data especially its empty or not
      if(
        [userName,email,fullName,password].some((field)=> field?.trim()==="") // field => !field || field.trim() === ""
      ){
        throw new ApiError(400,"fill the required field")
      }
    //  check if user already exists with same email or username or with another parameter uses index in model with unique true
   const existeduser= await User.findOne({
      $or:[
        { userName:userName.toLowerCase() },
        { email }
      ]
    })
    if(existeduser){ throw new ApiError(409,"User Already exist")}
    // check for avatar(mandatory) & cover image 
     //upload the avatar and cover image to local storage using multer middleware which increases the req field withe req.files
    // check whether the files are present or not in local storage specially avatar as it is mandatory
    // req.files is an object that contains arrays of files (avatar & cover image) these arrays contains objects of file details at index 0 & then this [0] index contains path property which contains the local path of uploaded file
    const avatarLocalpath=req.files?.avatar[0]?.path
    console.log("avatar local path:",avatarLocalpath)
    let coverLocalpath;
     if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverLocalpath= req.files.coverImage[0].path
     }
    console.log("cover image local path:",coverLocalpath)
    if(!avatarLocalpath){
       throw new ApiError(400,"avatar file is required")
    }
    // upload the avatar and cover image to cloudinary and get the url of uploaded image from cloudinary response
    // check whether the upload is successful or not in cloudinary
   const avatarlink= await uploadOncloudinary(avatarLocalpath) // only response comes
   console.log("avatar link from cloudinary:",avatarlink) 
   const coverlink =await uploadOncloudinary(coverLocalpath)  
   console.log("cover image link from cloudinary:",coverlink)  // only reponse comes
   if(!avatarlink) throw new ApiError (500,"Error in uploading avatar image")

    
    // create the user in db with user model and remeber one thing this is mongoose(nosql) so we need to make an object of user model and then save it to db
    const user= await User.create(
    {
      
      fullName,
      email,
      avatar:avatarlink.url,
      coverimage:coverlink?.url || "",
      password,
      userName:userName.toLowerCase()
    }
   )
    // check whether the user is created successfully or not in db
  // if users created send the response except the password & refresh token
   const createdUser= await User.findById(user._id).select(
      "-password -refreshToken"
    )
    if(!createdUser) throw new ApiError(500,"Error in creating user")
 return    res.status(201).json(
  new ApiResponse(201,createdUser,"User successfully registered")
  )

    

})
export {userRegister};