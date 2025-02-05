import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

if(!process.env.MONGODB_URI){
   throw new Error("Please provide MongoDB URI in .env file")
}

const connectDB = async() => {
    try{
         await mongoose.connect(process.env.MONGODB_URI)
         console.log("Connected to MongoDB")
    }catch(error){
       console.log("Mongodb connection error",error)
       process.exit(1)
    }
}

export default connectDB