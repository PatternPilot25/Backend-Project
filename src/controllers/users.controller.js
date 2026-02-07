import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { uploadOncloudinary } from "../utils/cloudinaryservice.js"
import {User} from "../models/user.model.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import {v2 as cloudinary} from "cloudinary"
const generateAccessandRefreshtoken=async(userId)=>{
  console.log("generating access and refresh token for user id:",userId)
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
const deleteimagesfromcloudinary=async(dummyLink)=>{
const public_Id=dummyLink?.split("/").slice(-1)[0].split(".")[0];
await cloudinary.uploader.destroy(public_Id,{
  resources_rype:"auto"
})
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
   console.log("user logged in successfully:")
  return  res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)  // now res.cookie(cookie) is send to browser whenever a new request nowonboards hit the cookie-parser read that cookie header & store in req.cookie so that middleware can use it . it can happens only when once the cookie is set
   .json(
    new ApiResponse(
      200,
      {
       user: loggedInuser, accessToken , refreshToken
      },
      "user logged in successfully"
    )
   ) 
   // console that user logged in

})
const logOutUser= asyncHandler(async(req,res)=>{
  //check whether the user is authorized or not so we use the auth middleware before this logout controller -> used verifyjwt middleware
console.log("logging out user:",req.user._id)
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
const refreshAccessToken=asyncHandler(async(req,res)=>{
           const incomingRefreshToken=  req.cookies?.refreshToken || req.body?.refreshToken
           if(!incomingRefreshToken){
            throw new ApiError(401,"unauthorized request")
           }
          try {
             const Token= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
             const user= await User.findById(Token?._id)
             if(!user){
              throw new ApiError(401,"user not exist in db");
             }
             if(incomingRefreshToken !==user.refreshToken) {
              throw new ApiError(401,"umauthorized request");
             }
             const Options={
              httpOnly:true,
              secure:true
             }
          const  {accessToken,refreshToken}=await generateAccessandRefreshtoken(user._id);
          res.status(200).cookie("accessToken",accessToken,Options)
          .cookie("refreshToken",refreshToken,Options).json(
            new ApiResponse(200,{accessToken,refreshToken},"successfully generated access & refresh Token")
          )
          } catch (error) {
            throw new ApiError(401,error?.message || "Invalid refresh token ")
          }
})
const changeCurrentPassword=asyncHandler(async(req,res)=>{
      const {oldpassword,newpassword,conformpassword}=req.body
      if(newpassword !== conformpassword){
        throw new ApiError(400,"new password and confirm password does not match")
      }
      // the person is authorized or not so we use the auth middleware before this change password controller
      const user= await User.findById(req.user?._id)
      const passwordValidity=await user.isPasswordCorrect(oldpassword);
      if(!passwordValidity){
        throw new ApiError(401,"Incorrect password")
      }
      user.password=newpassword 
     await  user.save({validateBeforeSave:false});
     return res.status(200).json(
      new ApiResponse(200,{},"password is successfully updated")
     )
})
const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200).json(
    new ApiResponse(200,
       req.user
  ,"user fetched successfully")
  )
})
// const updateAccountDetails=asyncHandler(async(req,res)=>{
//   const {fullName,email}= req.body
//   if((!fullName ) && (!email)){
//     throw new ApiError(400,"atleast fullName or email required")
//   }
//            const user=    await User.findByIdAndUpdate(req.user?._id,
//                   {  $set:{
//                     fullName,
//                     email
//                   }
//                   },{
//                     new:true
//                   }
//                 ).select("-password")

//                 return res.status(200).json(
//                   new ApiResponse(200,user,"Account updated successfully")
//                 )
// })
const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullName,email}= req.body
    const toCompute={};
    const user= req.user
    if(fullName?.trim()){
      const usedName=fullName.trim();
          if(usedName !== user.fullName){
            toCompute.fullName=usedName
          }
    }     
    if(email?.trim()){
      const usedEmail=email.trim()
          if(usedEmail !== user.email){
            toCompute.email=usedEmail
          }
    }              
    if(Object.keys(toCompute).length===0){
      throw new ApiError(400,"atleast fullName or email required or both should be different from existing one")
    }
  const updatedUser=await  User.findByIdAndUpdate(user._id,{
      $set:toCompute  // if any or both are present then it will update the presented field 
    }
  ,{
        new:true
      }).select("-password -refreshToken")

      return res.status(200).json(
        new ApiResponse(200,updatedUser,"User information updated Successfully" )
      )
}) 
const updateUserCover= asyncHandler(async(req,res)=>{
  const localcoverLink=req.file?.path
  console(req.file)
  if(!localcoverLink) {
    throw new ApiError(401,"cover file is required")
  }
      // now we need also to delete the previous avatar from cloudinary 
  const dummyUser=  User.findById(req.user._id)

  const dummyLink= dummyUser.avatar
   const cloudLink= await uploadOncloudinary(localcoverLink)
   if(!cloudLink.url){
    throw new ApiError(500,"unable to upload on cloudinary")
   }

   const user= await User.findByIdAndUpdate(req.user._id,{
      $set:{
        coverimage:cloudLink.url 
      }
     },
    {
      new :true
    }).select("-password refreshToken")
     if(dummyLink){
    deleteimagesfromcloudinary(dummyLink)
     }
    return res.status(200).
    json(
      new ApiResponse(200,user,"cover image  updated successfully")
    )
})
const updateUserAvatar= asyncHandler(async(req,res)=>{
  const localavatarLink=req.file?.path
  if(!localavatarLink) {
    throw new ApiError(401,"avatar file is required")
  }
      // now we need also to delete the previous avatar from cloudinary 
  const dummyUser=  User.findById(req.user._id)
  const dummyLink= dummyUser.avatar
   const cloudLink= await uploadOncloudinary(localavatarLink)
   if(!cloudLink.url){
    throw new ApiError(500,"unable to upload on cloudinary")
   }

   const user= await User.findByIdAndUpdate(req.user._id,{
      $set:{
        avatar:cloudLink.url 
      }
     },
    {
      new :true
    }).select("-password refreshToken")
   
    deleteimagesfromcloudinary(dummyLink)
    return res.status(200).
    json(
      new ApiResponse(200,user,"avatar updated successfully")
    )
})
const getUserChannelProfile= asyncHandler(async(req,res)=>{
 const {userName} =req.params
 if(!userName?.trim()){ // if userName is not present throw an error or if userName present then trim it and if after trimming it is empty then also throw an error
  throw new ApiError(400,"Invalid userName")
 }
const channel= await User.aggregate([
  {
    $match:{
      userName:userName 
    }
 },
 {   // the lookup stage is used for left join
  // the lookup add tempory array field in the user document with name subscribers which contains the list of all subscribers of that channel and also add another temporary array field with name subscribedTo which contains the list of all channels to which that user is subscribed to
  // those array field contains the list of all subscribers of that channel in form of the subscription model document(subscriber and channel like an object ) as the matching of localField and foreign field 
  $lookup:{
    from:"subscriptions",
    localField:"_id",
    foreignField:"channel",
    as:"subscribers"
  }
 },{
  $lookup:{
    from:"subscriptions",
    localField:"_id",
    foreignField:"subscriber",
    as:"subscribedTo"
  }
 },
{
  $addFields:{ // add fields to the user document 
    subscribersCount:{
         $size:"$subscribers"
    },
    channelSubscribedToCount:{
      $size:"$subscribedTo"
    },
    isSubscribed:{ // check whether the logged in user is subscribed to that channel or not
      $cond:{
        if: {$in:[(req.user?._id),"$subscribers.subscriber"]},
        then:true,
        else:false
      }
    }
  }
},
{
  $project:{   // project is used to select the required fields from the user document .
    userName:1,
    fullName:1,
    subscribersCount:1,
    channelSubscribedToCount:1,
    avatar:1,
    coverImage:1,
    isSubscribed:1
  }
}

])  // the aggregate resultant returns an array of user document with all the field mentioned in project stage
if(!channel?.length){ // if the channel is not present in db then throw an error && if channel is present but the length of channel array is 0 then also throw an error because it means that there is no channel with that userName
  throw new ApiError(404,"channel doesnt exist")
}
return res.status(200).json(new ApiResponse(200,channel[0],"User channel fetched succesfully"))
// the aggregate resultant returns an array which means channel may contain more than one document but in our case it will contain only one document because userName is unique in our user model so we can access that channel document with index 0 of channel array
})
export {userRegister,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover
};
// .save() tracks and processes changes; findByIdAndUpdate() blindly updates what you tell it.
// when we use findByIdAndUpdate() it will not trigger the pre save middleware for hashing password so we have to use save() method to trigger that pre save middleware for hashing password
//mongoose(when u say user.find()) first take all the original field values of the document & mark all of them as unmodified when it sees assignment like user.password=newpassword it will mark password field as modified and when we call save() method it will check which field is modified and then trigger the pre save middleware for that modified field only in our case it is password field so it will trigger the pre save middleware for hashing password but if we use findByIdAndUpdate() it will not track any changes and it will not trigger the pre save middleware for hashing password so we have to use save() method to trigger that pre save middleware for hashing password
// if we want to just update something we need findbyid & update to just update that field 
// findById() loads a document into Mongoose’s change-tracking system.
//findByIdAndUpdate() does NOT load a document at all.