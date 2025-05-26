import dotenv from 'dotenv';
import app from '@/app';
import dbconnection from '@/config/database.config';
import {  PORT } from '@/config/env.config';
import { cloudinaryConnect } from '@/config/cloudinary.config';

dotenv.config();

// Initialize Cloudinary
    // cloudinary.config({
    //     cloud_name: CLOUDINARY_CLOUD_NAME,
    //     api_key: CLOUDINARY_API_KEY,
    //     api_secret: CLOUDINARY_API_SECRET
    // });
    
    cloudinaryConnect();

dbconnection()
    .then(() => {
        console.log('----> Database connected successfully');

        // Start the server after a successful database connection
        app.listen(PORT, () => {
            console.log(`----> Server is running at port: ${PORT}`);
        });
    })
    .catch((error: Error) => {
        console.log('----> App failed to start due to DB connection failure:', error);
    });

export default app; 