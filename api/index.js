import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from '../config/connectDB.js';
import userRouter from '../routes/user.route.js';


dotenv.config();

const app = express()
app.use(cors({
    credentials : true,
    origin : process.env.FRONTEND_URL,
    methods : ["GET","POST","PUT","DELETE"],
    allowedHeaders : ["Content-Type","Authorization"]
}))

app.use(express.json())
app.use(cookieParser())
app.use(morgan())
app.use(helmet({
    crossOriginResourcePolicy : false
}))

app.use((req,res,next)=>{
    const allowedOrigin = process.env.FRONTEND_URL;
    if(req.headers.origin && req.headers.origin !== allowedOrigin){
        return res.status(403).json({message:"Forbidden"})
    }
    next();
})

const PORT = 8080 || process.env.PORT;


app.use("/api/user",userRouter)

connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log("Server is running",PORT)
    })
})

app.get("/",(req,res)=>{
    res.json({message:`Server is running on ${PORT}`})
})



