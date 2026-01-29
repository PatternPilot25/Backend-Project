import mongoose, {Schema} from 'mongoose';
import bycrypt from 'bycrypt';
import jwt from 'jsonwebtoken';
const userSchema= new Schema({
       userName:{
          type:String,
          required:[true,"User Name is required"],
          unique: true,
          trim :true,
          lowercase:true,
          index:true // for faster search in database mean it enable searching through userName quickly
       },
       email:{
         type:String,
          required:[true,"Email is required"],
          unique: true,
          trim :true,
          lowercase:true,
       },
       fullName:{
          type:String,
          required:[true,"Full Name is required"],
          trim :true,
          index:true
       },
       avatar:{
        type:String, // used claudinary url in that project
        required:[true,"Avatar is required"],


       },
       coverimage:{
         type:String
       },
       password:{
          type:String,
          required:[true,"Password is required"]
       },
       refreshToken:{
            type:String
       },
       watchHistory:[
          {
            type:Schema.Types.ObjectId,
            ref:"Video"
          }
       ]
},{timestamps:true})
// middleware for hashing password before saving user document
userSchema.pre("save", async function(next){    // we cant use arroe function as we know arrow function has no this(keyword) point to current object
   if(!this.isModified("password")) return next();   
   this.password=bycrypt.hash(this.password,10)
   next();
})
// added a new method to check password
userSchema.methods.isPasswordCorrect= async function(password){
  return await bycrypt.compare(password,this.password) // return a boolean value 
}
// method to generate access token
userSchema.methods.generateAcessToken=function(){
 return  jwt.sign(
      { 
         _id:this._id,
         email:this.email,
         userName:this.userName,
         fullName:this.fullName
      },
      process.env.ACCESS_TOKEN_SECRET,

      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
  )
}
userSchema.methods.generateRefreshToken= function(){
   return  jwt.sign(
      {
         _id:this._id
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
         expiresIn:process.env.REFRESH_TOKEN_EXPIRES_IN
      }
     )
}
export const User= mongoose.model("User",userSchema);