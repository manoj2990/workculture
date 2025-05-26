import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/config/env.config';
import UserModel from '@/models/user.model';
import ApiError from '@/utils/apiError.utils';

class PasswordService {
    // Reset password using token
    async resetPassword(userId: string, token: string, newPassword: string) {
        try {
            // Verify the JWT token
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

            // Validate token matches user
            if (decoded.id !== userId) {
                throw new ApiError(403, 'Invalid token or user ID');
            }

            // Find user
            const user = await UserModel.findById(userId);
            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            // Check if new password is different
            const isSamePassword = await compare(newPassword, user.password);
            if (isSamePassword) {
                throw new ApiError(400, 'New password must be different from current password');
            }

            // Update password
            const hashedPassword = await hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();

            return { message: 'Password has been reset successfully' };
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new ApiError(401, 'Invalid or expired token');
            }
            if (error instanceof jwt.TokenExpiredError) {
                throw new ApiError(401, 'Token has expired');
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'An error occurred while resetting password');
        }
    }

    // Change password (for logged-in users)
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        try {
          
            // Find user with password
            const user = await UserModel.findById(userId).select('+password');
            if (!user) {
                throw new ApiError(404, 'User not found');
            }


            // Verify current password
            const isPasswordValid = await compare(currentPassword, user.password);
            if (!isPasswordValid) {
                throw new ApiError(400, 'Current password is incorrect');
            }

           

            // Check if new password is different
            const isSamePassword = await compare(newPassword, user.password);
            if (isSamePassword) {
                throw new ApiError(400, 'New password must be different from current password');
            }

           

            // Update password
            const hashedPassword = await hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();

            

            return { message: 'Password changed successfully' };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'An error occurred while changing password');
        }
    }
}

export default new PasswordService(); 