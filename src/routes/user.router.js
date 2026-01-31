import { Router} from "express";
import { userRegister } from "../controllers/users.controller.js";
const router=Router();

router.route("/registration").post(userRegister);
export default router;