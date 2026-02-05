import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { uploadOncloudinary } from "../utils/cloudinaryservice.js"
import {User} from "../models/user.model.js"
import ApiResponse from "../utils/ApiResponse.js"

const generateAccessandRefreshtoken=async(userId)=>{
    try {
     const user= await User.findById(userId)
         const accessToken=  user.generateAccessToken(); 
         const refreshToken= user.generateRefreshToken();
         user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})   // every time while saving user document password will be hashed so to avoid that we set validateBeforeSave to false 
        return {accessToken,refreshToken}                                   // we are not validatebeforesave off because of just pre hook of password hashing actually whenever we save user document then the mongoose will check the validation of all fields according to schema so to avoid that we set validateBeforeSave to false we say dont worry about validation just save it
    } catch (error) {
      throw new  ApiError(500,"something went wrong while generating refresh & access token")
      
    }
}
// every controller is a middleware but inverse is not true one more thing is controller is used in last step and all the business related logic is written here it  works in db operations also manipulation of db data and sending responseto the client 
const userRegister=asyncHandler(async(req,res)=>{
    
  // get the user data from frontend using req.body if data is sent through body (json or form data)
       const {userName, email, fullName, password } = req.body
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
      // console.log("avatar local path:",avatarLocalpath)
    let coverLocalpath;
     if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverLocalpath= req.files.coverImage[0].path
     }
   // console.log("cover image local path:",coverLocalpath)
    if(!avatarLocalpath){
       throw new ApiError(400,"avatar file is required")
    }
    // upload the avatar and cover image to cloudinary and get the url of uploaded image from cloudinary response
    // check whether the upload is successful or not in cloudinary
   const avatarlink= await uploadOncloudinary(avatarLocalpath) // only response comes
   //  console.log("avatar link from cloudinary:",avatarlink) 
   const coverlink =await uploadOncloudinary(coverLocalpath)  
  // console.log("cover image link from cloudinary:",coverlink)  // only reponse comes
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
const loginUser=asyncHandler(async(req,res)=>{
  //username or email is required
  const {userName, email, password}= req.body
  //check that username or email exist or not 
  if(!userName && !email) {
    throw new ApiError(400, " username or email required");
  }
  const user=await User.findOne({
    $or: [{userName},{email}]
   })
   if(!user) {
    throw new  ApiError(404,"username or password is incorrect")
   }
  // check password
     const validUser= await user.isPasswordCorrect(password);
  // check password is correct 
  if(!validUser) {
    throw new ApiError(401,"Invalid user credentials")
  }
  // work on refreshtoken & access token set the refresh token to the user 
  const {accessToken,refreshToken}= await generateAccessandRefreshtoken(user._id);
  const loggedInuser=await User.findById(user._id).select(
    "-password -refreshToken"
  )
  // send the access token as the response 
  //Cookies are set in responses, stored by the browser, sent automatically on future requests, and read by cookie-parser into req.cookies.means now res.cookie is just for browser to tell them store the cookie & this send the set-cookie header (res.cookie)
   const options={  // options are used so that front end cant modify it only server can modify
    httpOnly:true,
    secure:true
   }
  return  res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)  // now res.cookie(cookie) is send to browser whenever a new request nowonboards hit the cookie-parser read that cookie header & store in req.cookie so that middleware can use it . it can happens only when once the cookie is set
   .json(
    new ApiResponse(
      200,
      {
       user: loggedInuser,accessToken,refreshToken
      },
      "user logged in successfully"
    )
   ) 
   // console that user logged in

})
const logOutUser= asyncHandler(async(req,res)=>{
  //check whether the user is authorized or not so we use the auth middleware before this logout controller -> used verifyjwt middleware

  const user=await User.findByIdAndUpdate(req.user._id,
      {// remove the refresh token from the db
          $unset:{
            refreshToken:1 // unset is used so that refresh token is  removed from the user document in db completely .
          }
      },
      {
        new:true
      }
    )
   const options={
    httpOnly:true,
    secure:true
   }
  // remove the refresh & access token cookies from the browser
  return res.status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options).json(
    new ApiResponse(200,{},"user logged out successfully")
  )
})
export {userRegister,
  loginUser,
  logOutUser
};