import nodemailer from 'nodemailer';
import { MAIL_HOST, MAIL_USER, MAIL_PASS } from '@/config/env.config';
// import { generateVerificationToken } from '@/utils/jwt.utils';
import ApiError from './apiError.utils';

// Email templates
const templates = {
    otp: (otp: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>OTP Verification</h2>
            <p>Your OTP for verification is: <strong>${otp}</strong></p>
            <p>This OTP will expire in 5 minutes.</p>
            <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
    `,
    verification: (token: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Please click the link below to verify your email:</p>
            <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}" 
               style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none;">
                Verify Email
            </a>
            <p>This link will expire in 1 hour.</p>
        </div>
    `,
    welcome: () => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to SkillSparc</h2>
            <p>Thank you for signing up with SkillSparc. We're excited to have you on board!</p>
        </div>
    `,
    passwordReset: (resetLink: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the link below to reset it:</p>
            <a href="${resetLink}" 
               style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none;">
                Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
    `
};

// Base email sending function
const sendEmail = async (to: string, subject: string, html: string) => {
    
    try {
       
        const transporter = nodemailer.createTransport({
            host: MAIL_HOST,
            auth: {
                user: MAIL_USER,
                pass: MAIL_PASS,
            }
        });
       
        const info = await transporter.sendMail({
            from: 'SkillSparc',
            to,
            subject,
            html
        });
     
        return info;
    } catch (error) {
        throw new ApiError(500, 'Error sending email');
    }
};






// Send OTP to Email
export const send_OTP_To_Email = async (email: string, otp: string) => {

    return sendEmail(
        email,
        'OTP Verification',
        templates.otp(otp)
    );
};






// Send Welcome Email
export const send_Welcome_Email = async (email: string) => {
    return sendEmail(
        email,
        'Welcome to SkillSparc',
        templates.welcome()
    );
};





// Email Verification
// export const send_Verification_Email = async (email: string, userId: string) => {
//     const token = generateVerificationToken({ userId, type: 'email' });
//     return sendEmail(
//         email,
//         'Email Verification',
//         templates.verification(token)
//     );
// };






// Send Password Reset Email
export const send_PasswordReset_Email = async (email: string, resetLink: string) => {
    return sendEmail(
        email,
        'Password Reset Request',
        templates.passwordReset(resetLink)
    );
};





// Token Verification
export const verifyToken = async (token: string, type: string) => {
    try {
        
        return {
            userId: 'mock-user-id',
            type
        };
    } catch (error) {
        return null;
    }
}; 