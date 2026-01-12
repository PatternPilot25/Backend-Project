import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async()=>{
    try{  // return an object mongoose connection
       const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       console.log(`\n mongoDB connected !! DB host : ${connectionInstance.connection.host}`)
    }
    catch(error){
        console.log("MONGODB CONNECTION FAILED",error);
        process.exit(1)
    }
}
export default connectDB;