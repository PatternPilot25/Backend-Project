import { Router} from "express";
import { logOutUser, userRegister,refreshAccessToken,changeCurrentPassword, updateAccountDetails,getCurrentUser } from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser } from "../controllers/users.controller.js";

import { verifyJwt } from "../middlewares/auth.middleware.js";
const router=Router();
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
    router.route("/logout").post(verifyJwt,logOutUser);
    router.route("/refresh-token").post(refreshAccessToken);
    router.route("/change-password").post(verifyJwt,changeCurrentPassword)
    router.route("/get-user").post(verifyJwt,getCurrentUser)
    router.route("/update-account").post(verifyJwt,updateAccountDetails)
export default router;