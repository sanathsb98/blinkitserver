import sendEmail from "../config/sendEmail.js";
import UserModel from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import dotenv from 'dotenv';
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import uploadImageCloudinary from "../utils/uploadImageCloudinary.js";
import generateOtp from "../utils/generateOtp.js";
import { response } from "express";
import forgotPasswordTemplate from "../utils/forgotPasswordTemplate.js";
import jwt from 'jsonwebtoken';

dotenv.config()

const registerUserController = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "provide email, name and password",
                err: true,
                success: false
            })
        }
        const user = await UserModel.findOne({ email })
        if (user) {
            return res.json({ message: "Email already registered" })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(password, salt)

        const payload = {
            name,
            email,
            password: hashPassword
        }

        const newUser = new UserModel(payload)
        const save = await newUser.save()
        console.log(save._id)
        const VerifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save._id}`;

        console.log("Attempting to send verification email to:", email);

        const verifyEmail = await sendEmail({
            sendTo: email,
            subject: "Blinkit Verification Mail",
            html: verifyEmailTemplate({
                name,
                url: VerifyEmailUrl
            })
        })

        console.log("Email function executed:", verifyEmail);

        return res.json({
            message: "User registered successfully",
            err: false,
            success: true,
            data: save
        })

    } catch (err) {
        return res.status(500).json({ message: err.message || err, err: true, success: false })
    }
}

const verifyEmailController = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await UserModel.findOne({ _id: code })
        if (!user) {
            return res.status(400).json({
                message: "Invalid code",
                error : true,
                success : false
            })
        }
        const updateUser = await UserModel.updateOne({ _id: code }, { verify_email: true })
        return res.json({
            message : "Verify email done",
            success : true,
            error : false
        })
        console.log(code)
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            err: true,
            success: false
        })
    }
}

const loginController = async (req,res) => {
    try{
       const {email,password} = req.body;

       if(!email || !password){
        return res.status(400).json({
            message : "provide valid email & password"
        })
       }

       const user = await UserModel.findOne({email})

       if(!user){
        return res.status(400).json({
            message : "User not registered",
            error : true,
            success : false
        })
       }
       
       if(user.status !== "Active"){
        return res.status(400).json({
            message : "Account not active",
            error : true,
            success : false
        })
       }

       const checkPassword = await bcryptjs.compare(password,user.password)
       if(!checkPassword){
        return res.status(400).json({
            message : "Invalid password",
            error : true,
            success : false
        })
       }

        const accesstoken = await generateAccessToken(user._id)
        const refresh_token = await generateRefreshToken(user._id)

        res.cookie('accessToken',accesstoken,{
            httpOnly : true,
            secure : true,
            sameSite : 'None'
        })

        res.cookie('refreshToken',refresh_token,{
            httpOnly : true,
            secure : true,
            sameSite : 'None'
        })

        return res.json({
            message: "Login successful",
            error: false,
            success: true,
            data: {
                accesstoken,
                refresh_token
            }
        })

    }catch(error){
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

const logoutController = async (req,res) => {

    try{

        const userId = req.userId;
        
          res.clearCookie('accessToken',{
            httpOnly : true,
            secure : true,
            sameSite : 'None'
          })
          res.clearCookie('refreshToken',{
            httpOnly : true,
            secure : true,
            sameSite : 'None'
          })

          const removeRefreshToken = await UserModel.updateOne({_id:userId},{refresh_token : ""})

          return res.json({
              message : "Logout successful",
              error : false,
              success : true
          })
    }catch(error){
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

const uploadAvatar = async (req,res) => {
 try{
    const image = req.file; // multer middleware
    const userId = req.userId; // auth  middleware
    const upload = await uploadImageCloudinary(image)

    const updateUser = await UserModel.findByIdAndUpdate({_id:userId},{avatar : upload.url})

    
    return res.json({
        message : "Image uploaded successfully",
        error : false,
        success : true,
        _id : userId,
        avatar : upload.url
    })
 }catch(error){
    return response.status(500).json({
        message : error.message || error,
        error : true,
        success : false
    })
 }
}

const updateUserDetails = async (req, res) => {
    try {
        const userId = req.userId; // auth middleware
        const { name, email, mobile, password } = req.body;
        let hashPassword = "";

        if(password){
            const salt = await bcryptjs.genSalt(10)
            hashPassword = await bcryptjs.hash(password, salt)
        }

        const updateUser = await UserModel.updateOne({ _id: userId }, {
            ...(name && { name: name }),
            ...(email && { email: email }),
            ...(mobile && { mobile: mobile }),
            ...(password && { password: hashPassword }),
        })

        return res.json({
            message: "User updated successfully",
            error: false,
            success: true,
            data: updateUser
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

const forgotPasswordController = async (req,res) => {
    try{
        const {email} = req.body;
        const user = await UserModel.findOne({email})
    
        if(!user){
            return res.status(400).json({
                message : "User not registered",
                error : true,
                success : false
            })
        }

        const otp = generateOtp()
        const expireTime = new Date() + 60 * 60 * 1000 //1hr

        const update = await UserModel.findByIdAndUpdate({_id:user._id},{
            forgot_password_otp : otp,
            forgot_password_expiry : new Date(expireTime).toISOString()
        })

        await sendEmail({
            sendTo : email,
            subject : "Blinkit Forgot Password",
            html : forgotPasswordTemplate({
                name : user.name,
                otp : otp
            })
        })

        return res.json({
            message : "Otp sent to email",
            error : false,
            success : true
        })

    }catch(error){
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

const verifyForgotPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log(email, otp)
        const user = await UserModel.findOne({ email })

        if (!email || !otp) {
            return res.status(400).json({
                message: "Provide email and otp",
                error: true,
                success: false
            })
        }

        if (!user) {
            return res.status(400).json({
                message: "User not registered",
                error: true,
                success: false
            })
        }

        const currentTime = new Date().toDateString();
        if (user.forgot_password_expiry < currentTime) {
            return res.status(400).json({
                message: "Otp expired",
                error: true,
                success: false
            })
        }

        if (user.forgot_password_otp !== otp) {
            return res.status(400).json({
                message: "Invalid otp",
                error: true,
                success: false
            })
        }

        return res.json({
            message: "Otp verified successfully",
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

const resetPasswordController = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if(!email || !newPassword || !confirmPassword){
            return res.status(400).json({
                message : "Provide required fields",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })
        if(!user){
            return res.status(400).json({
                message : "User not registered",
                error : true,
                success : false
            })
        }
        if(newPassword !== confirmPassword){
            return res.status(400).json({
                message : "Password not matched",
                error : true,
                success : false
            })
        }
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(newPassword,salt)
        const update = UserModel.findOneAndUpdate(user.id,{password : hashPassword})

        return res.json({
            message : "Password updated successfully",
            error : false,
            success : true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

const refreshTokenController = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req?.header?.authorization?.split('')[1];
        if (!refreshToken) {
            return res.status(400).json({
                message: "Invalid token",
                error: true,
                success: false
            })
        }
        const verifyToken = await jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN)
        if (!verifyToken) {
            return res.status(400).json({
                message: "Invalid token",
                error: true,
                success: false
            })
        }
        const newAccessToken = await generateAccessToken(verifyToken?.id)
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        })

        return res.json({
            message: "New Acess Token Generated",
            error: false,
            success: true,
            data: {
                accessToken: newAccessToken
            }
        })

        console.log(refreshToken)
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
   
export default
    {
        registerUserController,
        verifyEmailController,
        loginController,
        logoutController,
        uploadAvatar,
        updateUserDetails,
        forgotPasswordController,
        verifyForgotPasswordOtp,
        resetPasswordController,
        refreshTokenController
    };