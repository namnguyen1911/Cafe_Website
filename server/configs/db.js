import mongoose from "mongoose";

const connectDB = async () => {
    try{
        //it checks if nodejs is connecting to mongoDB, it will emit this message
        mongoose.connection.on('connected', () => console.log("Databse Connected"));
        //Nodejs is trying to connect mongoDB
        await mongoose.connect(`${process.env.MONGODB_URI}/sauluccoffeeroastery`)
    } catch (error) {
        console.error(error.message)
    }
}

export default connectDB;