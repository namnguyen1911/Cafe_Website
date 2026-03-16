import express from 'express';
import authUser from '../middlewares/authUser.js';
import authSeller from '../middlewares/authSeller.js';
import { requireUserCsrf } from '../middlewares/requireCsrf.js';
import { getAllOrders, getUserOrders, placeOrderCOD, placeOrderStripe } from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.post('/cod', authUser, requireUserCsrf, placeOrderCOD)
orderRouter.post('/stripe', authUser, requireUserCsrf, placeOrderStripe)
orderRouter.get('/user',authUser, getUserOrders)
orderRouter.get('/seller',authSeller, getAllOrders)

export default orderRouter;
