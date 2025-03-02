import {Router} from 'express';
import controllers from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/multer.js';
const {registerUserController,verifyEmailController,loginController,logoutController,uploadAvatar,updateUserDetails,forgotPasswordController,verifyForgotPasswordOtp,resetPasswordController,refreshTokenController} = controllers;

const userRouter = Router()

userRouter.post("/register",registerUserController)
userRouter.post("/verify-email",verifyEmailController)
userRouter.post("/login",loginController)
userRouter.get("/logout",auth,logoutController)
userRouter.put("/upload-avatar",auth,upload.single('avatar'),uploadAvatar)
userRouter.put("/update-user",auth,updateUserDetails)
userRouter.post("/forgot-password",forgotPasswordController)
userRouter.put("/verify-forgot-password-otp",verifyForgotPasswordOtp)
userRouter.put("/reset-password",resetPasswordController)
userRouter.post("/refresh-token",refreshTokenController)

export default userRouter