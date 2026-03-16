import express from "express"
import authUser from "../middlewares/authUser.js"
import { requireUserCsrf } from "../middlewares/requireCsrf.js"
import { updateCart } from "../controllers/cartController.js";


const cartRouter = express.Router();

cartRouter.post('/update', authUser, requireUserCsrf, updateCart);

export default cartRouter;
