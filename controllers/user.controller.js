import sendEmail from "../config/sendEmail.js";
import UserModel from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import dotenv from 'dotenv';

dotenv.config()

const registerUserController = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("name______",name)
        console.log("email______",email)
        console.log("password______",password)
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
        const hashPassword = await bcryptjs.hash(password,salt)

        const payload = {
            name,
            email,
            password : hashPassword
        }

        const newUser = new UserModel(payload)
        const save = await newUser.save()
        const VerifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save._id}`;

        console.log("Attempting to send verification email to:", email);

        const verifyEmail = await sendEmail({
            sendTo : email,
            subject : "Blinkit Verification Mail",
            html : verifyEmailTemplate({
                name,
                url : VerifyEmailUrl
            })
        })

        console.log("Email function executed:", verifyEmail);

        return res.json({
            message : "User registered successfully",
            err : false,
            success : true,
            data : save
        })

    } catch (err) {
        return res.status(500).json({ message: err.message || err, err: true, success: false })
    }
}




export default registerUserController