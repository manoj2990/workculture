import { Request, Response, NextFunction } from 'express';
import ApiError from '@/utils/apiError.utils';

export const validateRequest = (requiredFields: string[]) => 
    (req: Request, res: Response, next: NextFunction) => {
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return next(new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`));
        }

        // Basic email validation
        if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
            return next(new ApiError(400, 'Invalid email format'));
        }

        // Basic password validation
        if (req.body.password && req.body.password.length < 2) {
            return next(new ApiError(400, 'Password must be at least 2 characters'));
        }

        next();
    }; 