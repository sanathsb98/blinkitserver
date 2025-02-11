import {Router} from 'express';
import controllers from '../controllers/user.controller.js';
const {registerUserController,verifyEmailController,loginController} = controllers;

const userRouter = Router()

userRouter.post("/register",registerUserController)
userRouter.post("/verify-email",verifyEmailController)
userRouter.post("/login",loginController)

export default userRouter