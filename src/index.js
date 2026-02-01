import connectDB from "./db/index.js"
import dotenv from "dotenv"
import app from "./app.js"
dotenv.config({
    path:'./.env'
})
// mongodb connection return the promises
connectDB().then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`\n server is running on port ${process.env.PORT}`)
    })
}).catch((err)=>{
    console.log("DB CONNECTION ERROR",err)
})
