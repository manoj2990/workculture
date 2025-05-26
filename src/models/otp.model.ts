import mongoose from 'mongoose';
import otpGenerator from 'otp-generator';

interface IOTPModel extends mongoose.Model<any> {
    generateOTP(): string;
    verifyOTP(email: string, otp: string): Promise<boolean>;
    isExpired(email: string): Promise<boolean>;
}

const OTPModel = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // OTP expires after 5 minutes
    }
});

// Generate OTP
OTPModel.static('generateOTP', function() {
    return otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false
    });
});

// Verify OTP
OTPModel.static('verifyOTP', async function(email: string, otp: string) {
    const otpRecord = await this.findOne({ email, otp });
    if (!otpRecord) {
        return false;
    }
    await this.deleteOne({ email });
    return true;
});

// Check if OTP is expired
OTPModel.static('isExpired', async function(email: string) {
    const otpRecord = await this.findOne({ email });
    if (!otpRecord) {
        return false;
    }
    return otpRecord.createdAt.getTime() + 300000 < Date.now();
});

export default mongoose.model<any, IOTPModel>('OTP', OTPModel);