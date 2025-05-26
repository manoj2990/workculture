import { Request, Response, NextFunction } from 'express';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiError from '@/utils/apiError.utils';
import { IUser } from '@/types/user.types';

// accountType-based access control middleware
export const isSuperAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    console.log("entering into isSuperAdmin middleware--->")
    if (!req.user?.accountType || req.user.accountType !== 'superadmin') {
        throw new ApiError(403, 'Access denied. SuperAdmin only.');
    }
    console.log("exiting from isSuperAdmin middleware--->")
    next();
});

export const isAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    console.log("entering into isAdmin middleware--->")
    console.log("req.user", req.user)
    console.log("req.user?.accountType", req.user?.accountType)
    if (!req.user?.accountType || req.user.accountType !== 'admin') {
        throw new ApiError(403, 'Access denied. Admin only.');
    }
    console.log("exiting from isAdmin middleware--->")
    next();
});

export const isEmployee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    console.log("entering into isEmployee middleware--->")
    if (!req.user?.accountType || req.user.accountType !== 'employee') {
        throw new ApiError(403, 'Access denied. Employee only.');
    }
    console.log("exiting from isEmployee middleware--->")
    next();
});

// Combined accountType check middleware
export const hasaccountType = (...accountTypes: IUser['accountType'][]) => {
    return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?.accountType || !accountTypes.includes(req.user.accountType)) {
            throw new ApiError(403, `Access denied. Required accountTypes: ${accountTypes.join(', ')}`);
        }
        next();
    });
}; 