import { Router} from "express";
import { logOutUser, userRegister } from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser } from "../controllers/users.controller.js";
const router=Router();
import { verifyjwt } from "../middlewares/auth.middleware.js";

router.route("/registration").post(
    // multer middleware to upload multiple files avatar & cover image && this will increase the req.files field
    upload.fields(
        [
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    userRegister);
    router.route("/login").post(loginUser)
    router.route("/logout").post(verifyjwt,logOutUser);
export default router;