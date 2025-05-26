import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MONGODB_URI } from '@/config/env.config';

dotenv.config();

const dbconnection = async (): Promise<void> => {
    try {
        console.log(`----> MongoDB connection start...`);
        await mongoose.connect(MONGODB_URI);
        console.log(`----> MongoDB connected successfull...`);
    } catch (error: any) {
        console.log(`----> dbconnection is failed!!!`, error.message);
        process.exit(1);
    }
};

export default dbconnection; 