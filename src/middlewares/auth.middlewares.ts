import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiError from '@/utils/apiError.utils';
import { IUser } from '@/types/user.types';
import { ACCESS_TOKEN_SECRET } from '@/config/env.config';
import UserModel from '@/models/user.model';

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export const auth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    console.log("entering into auth middleware--->")
    try {
        const accessToken = req.cookies?.accessToken || 
                          req.header("Authorization")?.replace("Bearer ", "") || 
                          req.body.accessToken ||
                          req.body.token;
        console.log("accessToken--->", accessToken)
        if (!accessToken) {
            throw new ApiError(401, "Access token is missing");
        }
     
        try {
            console.log("entering to decode the token--->")
            const decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as { 
                userId: string;
                name: string;
                accountType: string;
                email: string;
            };
            console.log("decodedToken--->", decodedToken)
            
            // Find the user in the database using the userId from the token
            const user = await UserModel.findById(decodedToken.userId).select('-password');
            if (!user) {
                throw new ApiError(401, "User not found");
            }
            
            // Set the user object in the request
            req.user = user;
            req.user.accessToken = accessToken
            console.log("exiting from auth middleware--->")
            next();
        } catch (error) {
            console.error("Access token verification failed:", error);
            throw new ApiError(401, "Invalid or expired access token");
        }
    } catch (error) {
        throw new ApiError(401, "Something went wrong while validating the token in auth");
    }
}); 