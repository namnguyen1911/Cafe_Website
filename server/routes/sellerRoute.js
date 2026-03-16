import express from 'express';
import { isSellerAuth, sellerLogin, sellerLogout } from '../controllers/sellerController.js';
import authSeller from '../middlewares/authSeller.js';
import { requireSellerCsrf } from '../middlewares/requireCsrf.js';

const sellerRouter = express.Router();

sellerRouter.post('/login',sellerLogin);
sellerRouter.get('/is-auth',authSeller, isSellerAuth);
sellerRouter.post('/logout', authSeller, requireSellerCsrf, sellerLogout);

export default sellerRouter;
