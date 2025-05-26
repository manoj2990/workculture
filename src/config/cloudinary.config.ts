import { v2 as cloudinary } from 'cloudinary';
import { 
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET 
} from './env.config';

export const cloudinaryConnect = (): void => {
    try {
        cloudinary.config({
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET,
        });
        console.log("----> Connection successfull with cloudiary.");
    } catch (err: any) {
        console.log(err);
        console.log("----> Could not connect to cloudinary.");
    }
}; 