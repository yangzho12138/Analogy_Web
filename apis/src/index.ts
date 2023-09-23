import mongoose from 'mongoose';
import { app } from './app';
import dotenv from 'dotenv';

dotenv.config({path: '../.env'})

const start = async() => {
    if(!process.env.JWT_KEY){
        throw new Error("JWT_KEY must be defined");
    }

    if(!process.env.MONGO_URI){
        throw new Error("MONGO_URI must be defined");
    }

    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connect success!")
    }catch (err){
        console.error(err)
    }

    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
    })
} 

start()