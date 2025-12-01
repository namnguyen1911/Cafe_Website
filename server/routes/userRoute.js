import express from 'express';
import { register, login, isAuth, logout } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import requireCsrf from '../middlewares/requireCsrf.js';

const userRouter = express.Router();


userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.get('/is-auth',authUser, isAuth)
userRouter.post('/logout',authUser, requireCsrf, logout)


export default userRouter;
