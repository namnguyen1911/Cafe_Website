import express from 'express';
import { isSellerAuth, sellerLogin, sellerLogout } from '../controllers/sellerController.js';
import authSeller from '../middlewares/authSeller.js';
import requireCsrf from '../middlewares/requireCsrf.js';

const sellerRouter = express.Router();

sellerRouter.post('/login',sellerLogin);
sellerRouter.get('/is-auth',authSeller, isSellerAuth);
sellerRouter.post('/logout', authSeller, requireCsrf, sellerLogout);

export default sellerRouter;
