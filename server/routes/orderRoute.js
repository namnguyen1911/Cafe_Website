import express from 'express';
import authUser from '../middlewares/authUser.js';
import authSeller from '../middlewares/authSeller.js';
import requireCsrf from '../middlewares/requireCsrf.js';
import { getAllOrders, getUserOrders, placeOrderCOD, placeOrderStripe } from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.post('/cod', authUser, requireCsrf, placeOrderCOD)
orderRouter.post('/stripe', authUser, requireCsrf, placeOrderStripe)
orderRouter.get('/user',authUser, getUserOrders)
orderRouter.get('/seller',authSeller, getAllOrders)

export default orderRouter;
