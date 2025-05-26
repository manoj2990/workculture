import { Request, Response } from 'express';
import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

import ApiError from '@/utils/apiError.utils';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiResponse from '@/utils/apiResponse.utils';
import UserModel from '@/models/user.model';

import { generateTokens } from '@/utils/jwt.utils';
import { getaccountTypeSpecificResponse } from '@/utils/roleResponse.utils';
import { send_PasswordReset_Email, send_Welcome_Email, verifyToken } from '@/utils/email.utils';
import otpService from '@/services/otp.service';


import { 
    loginSchema, 
    signupSchema, 
    refreshTokenSchema,
    passwordResetRequestSchema,
    passwordResetSchema,
    sendOTPSchema
} from '@/zodSchemas/auth.schema';
import { handleZodError } from '@/utils/zodErrorHandler.utils';
import { z } from 'zod';
import { changePasswordSchema } from '@/zodSchemas/user.schema';

import { NODE_ENV, REFRESH_TOKEN_SECRET, FRONTEND_URL, JWT_SECRET } from '@/config/env.config';
import passwordService from '@/services/password.service';
import mongoose, { isValidObjectId } from 'mongoose';
import { IUser } from '@/types/user.types';
import PersonalInfoModel from '@/models/personalInfo.model';
import RegistrationRequestModel from '@/models/registrationRequest';


type SignupInput = z.infer<typeof signupSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type SendOTPInput = z.infer<typeof sendOTPSchema>;
type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
type PasswordResetInput = z.infer<typeof passwordResetSchema>;
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// Get admin limits based on accountType
const getAdminLimits = (accountType: string) => {
    if (accountType === 'superadmin' || accountType === 'employee' || accountType === 'individual') {
        return undefined; // No limits for superadmin and employee
    }

    if (accountType === 'admin') {
        return {
            maxOrganizations: 0,
            maxCourses: 0,
            maxDepartments: 0,
            maxEmployees: 0,
            maxEmployeesPerOrg: [],
            // maxEmployeesPerDept: 0,
            maxEmployeesPerCourseDefault: 5,
            maxEmployeesPerCourse: []
        };
    }

    return undefined;
};




// Send OTP to user email --> fro employee & individual accountType
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
    const result = sendOTPSchema.safeParse(req.body);
    
    if (!result.success) {
        const errorResponse = handleZodError(result, res);
        if (errorResponse) return;
    }

    const { email } = result.data as SendOTPInput;



    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, 'Email already registered');
    }

    // Use OTP service to send OTP
    const otpResponse = await otpService.sendOTP(email);
    
    
    return new ApiResponse(200, {email, otp: otpResponse.otp}, 'OTP sent successfully').send(res);
});







//signup with otp verification --> need to refactor for individual accountType
export const signup = asyncHandler(async (req: Request, res: Response) => {
    const result = signupSchema.safeParse(req.body);
  
    if (!result.success) {
      const errorResponse = handleZodError(result, res);
      if (errorResponse) return;
    }
  
    const {
      email,
      password,
      name,
      accountType,
      otp,
      organization,
      jobTitle,
      department,
    } = result.data as SignupInput;
  
    if (organization && !isValidObjectId(organization) && accountType !== "individual") {
      throw new ApiError(400, "Invalid organization ID");
    }
  
    if (department && !isValidObjectId(department) && accountType !== "individual") {
      throw new ApiError(400, "Invalid department ID");
    }
  
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) throw new ApiError(409, "Email already in use");
  
    if (accountType === "admin" && (!req.user || req.user.accountType !== "superadmin")) {
      throw new ApiError(403, "Only superadmin can create admin users");
    }
  
    if (accountType === "superadmin" && req.user) {
      throw new ApiError(403, "Superadmin can only be created during system setup");
    }
  
    if (accountType === "employee"){
      // if (!otp) {
      //   throw new ApiError(400, "OTP is required for employee registration");
      // }
      if (!organization || !department || !jobTitle) {
        throw new ApiError(400, "Missing required fields for employee registration");
      }
      // await otpService.verifyOTP(email, otp);
    }


    if (accountType === "individual") {
      if (!otp || otp.length !== 6) {
        throw new ApiError(400, "Invalid OTP");
      }
      await otpService.verifyOTP(email, otp);
    }


  
    const hashedPassword = await hash(password, 10);
  
    const userData: Partial<IUser> = {
      email,
      password: hashedPassword,
      name,
      accountType,
    };
  
    if (accountType === "employee") {
      userData.jobTitle = jobTitle;
      userData.employeeData = {
        organization,
        department,
        enrolledCourses: [],
      };
    }
  
    if (accountType === "admin") {
      userData.adminLimits = getAdminLimits(accountType) as IUser['adminLimits'];
      userData.createdBySuperAdmin = req.user?._id;
    }


  
    // <<<<<<<<Start MongoDB transaction
    const session = await mongoose.startSession();
    try {
      session.startTransaction(); //yahs se transaction start ho rha hai
  
      const user = await UserModel.create([userData], { session }); //user create ho rha hai
      if (!user[0]) throw new ApiError(400, "Failed to create user");
  
      const personalInfo = await PersonalInfoModel.create( //user ki personal info create ho rha hai
        [{ user: user[0]._id, employeeName: name }],
        { session }
      );
      if (!personalInfo[0]) throw new ApiError(400, "Failed to create personal info");
  
      await UserModel.findByIdAndUpdate( //user ki personal info update ho rha hai->user schema me personalInfo field hai usme personalInfo id store ho rha hai
        user[0]._id,
        { personalInfo: personalInfo[0]._id },
        { session }
      );


      if(accountType === 'employee' || accountType === 'individual'){
        await RegistrationRequestModel.create({
          user:user[0]._id,
          accountType:accountType
        });
      }
  
      await session.commitTransaction(); //sb thik rha->transaction commit 
      session.endSession();// now session end ho rha hai
  //<<<<<<<End MongoDB transaction


//un-commect this line when development is done
      // await send_Welcome_Email(user[0].email); 

      // const responseData = await getaccountTypeSpecificResponse(user[0]);
      const responseData = accountType === 'admin' ? await getaccountTypeSpecificResponse(user[0] as IUser) :
       accountType === 'employee' || accountType === 'individual' ? 
       {_id:user[0]._id,
         name:user[0].name, 
         email:user[0].email, 
         accountType:user[0].accountType,
         status:user[0].accountStatus , 
         message: "Waiting for admin approval"
        }: '';
    
  
      return new ApiResponse(201, {
        ...responseData,
        message: `${accountType} created successfully`,
      }).send(res);
  
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(500, "Signup failed: " + err.message);
    }
  });
  
  


// Login
export const login = asyncHandler(async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        const errorResponse = handleZodError(result, res);
        if (errorResponse) return;
    }
    
    const { email, password } = result.data as LoginInput;
    
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Set tokens in cookies
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1 * 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Get accountType-specific response data
    const response = await getaccountTypeSpecificResponse(user);
    const responseData = {
      ...response,
      token: accessToken,
    }

    return new ApiResponse(200, {
        ...responseData,
        message: 'Login successful'
    }).send(res);
});



// Request Password Reset--> send password reset link to email
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const result = passwordResetRequestSchema.safeParse(req.body);

    if (!result.success) {
        const errorResponse = handleZodError(result, res);
        if (errorResponse) return;
    }
    
    const { email } = result.data as PasswordResetRequestInput;
    const user = await UserModel.findOne({ email });
    
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Generate a JWT token for the user with a short expiration time
    const token = jwt.sign({ id: user._id }, JWT_SECRET , { expiresIn: '1h' });

    // Create the password reset link
    const resetLink = `https://${FRONTEND_URL}/reset-password/${user._id}/${token}`;

    // Send the reset link via email
    await send_PasswordReset_Email(email, resetLink);

    return new ApiResponse(200, {email}, 'Reset password link sent to your email').send(res);
});



// Reset Password--> reset password using password reset link
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = passwordResetSchema.safeParse(req.body);

    if (!validationResult.success) {
        const errorResponse = handleZodError(validationResult, res);
        if (errorResponse) return;
    }
    
    const { userId, token } = req.params; //userId and token from url
    const { newPassword } = validationResult.data as PasswordResetInput;

    const resetResult = await passwordService.resetPassword(userId, token, newPassword);
    return new ApiResponse(200, null, resetResult.message).send(res);
});



// Change Password--> change password of current user
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
   
    const validationResult = changePasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
        const errorResponse = handleZodError(validationResult, res);
        if (errorResponse) return;
    }

    if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
    }

    const { currentPassword, newPassword } = validationResult.data as ChangePasswordInput;

    const changeResult = await passwordService.changePassword(req.user._id.toString(), currentPassword, newPassword);
   
    return new ApiResponse(200, null, changeResult.message).send(res);
});



// Logout
export const logout = asyncHandler(async (req: Request, res: Response) => {

    const user = req.user;
    if (!user) {
        throw new ApiError(401, 'Unauthorized');
    }

    // Clear the token cookies
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });


    return new ApiResponse(200, null, 'Logout successful').send(res);
});


// Refresh Token--> refresh access token using refresh token // need to refactor
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = refreshTokenSchema.safeParse(req.body);

    if (!validationResult.success) {
        const errorResponse = handleZodError(validationResult, res);
        if (errorResponse) return;
    }

    const { refreshToken } = validationResult.data as RefreshTokenInput;

    let decoded;
    try {
        decoded = await verifyToken(refreshToken, REFRESH_TOKEN_SECRET!);
    } catch (err) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Find user from token
    const user = await UserModel.findById(decoded?.userId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Set cookies again
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
        sameSite: 'strict',
    });

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
    });

    return new ApiResponse(200, {
        accessToken,
        refreshToken: newRefreshToken
    }, 'Token refreshed successfully').send(res);
});





// Email Verification--> verify email of user
// export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
//     const { token } = emailVerificationSchema.parse(req.body);
    
//     const payload = await verifyToken(token, 'email');
//     if (!payload) {
//         throw new ApiError(400, 'Invalid or expired verification token');
//     }

//     await UserModel.findByIdAndUpdate(payload.userId, { isEmailVerified: true });
    
//     return new ApiResponse(200, null, 'Email verified successfully').send(res);
// });