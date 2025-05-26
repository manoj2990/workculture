import { Request, Response } from 'express';
import ApiError from '@/utils/apiError.utils';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiResponse from '@/utils/apiResponse.utils';
import UserModel from '@/models/user.model';
import { uploadOnCloudinary } from '@/utils/cloudinary.utils';

// Get user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, 'Unauthorized');
    }

    const profile = await UserModel.findById(user._id)
        .select('-password -__v')
        .populate('employeeData.organization', 'name')
        .populate('employeeData.department', 'name')
        .populate('employeeData.enrolledCourses', 'title');

    return new ApiResponse(200, profile).send(res);
});

// Update user profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, 'Unauthorized');
    }

    const { name, email, profile } = req.body;

    // Check if email is being updated and if it's already taken
    if (email && email !== user.email) {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            throw new ApiError(409, 'Email already registered');
        }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        user._id,
        {
            $set: {
                ...(name && { name }),
                ...(email && { email }),
                ...(profile && { profile })
            }
        },
        { new: true }
    ).select('-password -__v');

    return new ApiResponse(200, updatedUser, 'Profile updated successfully').send(res);
});

// Update profile picture
// export const updateProfilePicture = asyncHandler(async (req: Request, res: Response) => {
//     const user = req.user;
//     if (!user) {
//         throw new ApiError(401, 'Unauthorized');
//     }

//     if (!req.file) {
//         throw new ApiError(400, 'No file uploaded');
//     }

//     // Upload to Cloudinary
//     const result = await uploadOnCloudinary(req.file.buffer);

//     // Update user profile with new picture URL
//     const updatedUser = await UserModel.findByIdAndUpdate(
//         user._id,
//         {
//             $set: {
//                 'profile.avatar_url': result.secure_url
//             }
//         },
//         { new: true }
//     ).select('-password -__v');

//     return new ApiResponse(200, updatedUser, 'Profile picture updated successfully').send(res);
// });

// Delete profile picture
export const deleteProfilePicture = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, 'Unauthorized');
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        user._id,
        {
            $unset: {
                'profile.avatar_url': 1
            }
        },
        { new: true }
    ).select('-password -__v');

    return new ApiResponse(200, updatedUser, 'Profile picture deleted successfully').send(res);
}); 