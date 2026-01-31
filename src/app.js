import express,{urlencoded} from 'express';
import cookiesParser from "cookie-parser";
import cors from 'cors';
const app= express();
app.use(cors({
    origin:process.env.CORS_ORIGIN, // to allow requests from this origin only
    Credentials:true // to allow cookies to be sent along with requests(user authentication data) to the server from the client
}))
app.use(urlencoded({extended:true}));// to parse urlencoded data from incoming requests
app.use(express.json()); // to parse json data from incoming requests
app.use(cookiesParser())  // to parse cookies from incoming requests or get the users cookies and perform(by server) crud operations on it.
app.use(express.static('Public')) // to serve static files like images ,css files ,js files publicly

import userRouter from "./routes/user.router.js"
// user routes that work as a middleware here
app.use("/api/v1/users",userRouter);
export default app;