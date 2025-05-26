import OTPModel from '@/models/otp.model';
import { send_OTP_To_Email } from '@/utils/email.utils';
import ApiError from '@/utils/apiError.utils';

class OTPService {
    async sendOTP(email: string) {
        try {
            console.log("sendOTP service called");
            console.log("email in sendOTP service", email);
            const existingOtp = await OTPModel.findOne({ email });
            if (existingOtp) {
               
                throw new ApiError(400, 'OTP already sent. Please wait before requesting again.');
            }
            


            // Generate OTP
            const otp = OTPModel.generateOTP();
           
            // Save OTP to database
            await OTPModel.create({ email, otp });
            

            // Send OTP via email
            // await send_OTP_To_Email(email, otp);
           console.log("otp sent successfully -->", otp)
            return { success: true, message: 'OTP sent successfully', otp };
        } catch (error) {
            throw new ApiError(500, 'Failed to send OTP');
        }
    }

    async verifyOTP(email: string, otp: string) {
        try {
            //check if otp is expired
            const isExpired = await OTPModel.isExpired(email);
            if (isExpired) {
                throw new ApiError(400, 'OTP expired');
            }

            const isValid = await OTPModel.verifyOTP(email, otp);
            if (!isValid) {
                throw new ApiError(400, 'Invalid OTP');
            }
            return { success: true, message: 'OTP verified successfully' };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to verify OTP');
        }
    }
}

export default new OTPService();