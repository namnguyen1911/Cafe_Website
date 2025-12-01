import express from "express"
import authUser from "../middlewares/authUser.js"
import requireCsrf from "../middlewares/requireCsrf.js"
import { updateCart } from "../controllers/cartController.js";


const cartRouter = express.Router();

cartRouter.post('/update', authUser, requireCsrf, updateCart);

export default cartRouter;
