import express from 'express';
import { upload } from '../configs/multer.js';
import authSeller from '../middlewares/authSeller.js';
import { requireSellerCsrf } from '../middlewares/requireCsrf.js';
import { addProduct, changeStock, productById, productList, updateProductById } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.post('/add', authSeller, requireSellerCsrf, upload.array("images"), addProduct)
productRouter.get('/list',productList)
productRouter.get('/:id',productById)
productRouter.put('/:id',authSeller, requireSellerCsrf, upload.array("images"), updateProductById)
productRouter.post('/stock',authSeller, requireSellerCsrf, changeStock)

export default productRouter;
