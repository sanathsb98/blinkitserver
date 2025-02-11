import sendEmail from "../config/sendEmail.js";
import UserModel from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import dotenv from 'dotenv';
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";

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


    



export default
    {
        registerUserController,
        verifyEmailController,
        loginController
    };