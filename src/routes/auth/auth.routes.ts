


import { Router } from 'express';
import { 
    login,
    signup,
    logout,
    refreshToken,
    sendOTP
} from '@/controllers/auth.Controller';
import { auth } from '@/middlewares/auth.middlewares';
import { validateSchema } from '@/middlewares/zodValidation.middleware';
import { 
    loginSchema, 
    signupSchema, 
    refreshTokenSchema,
    sendOTPSchema
} from '@/zodSchemas/auth.schema';

const router = Router();

// Public routes
router.post('/send-otp', validateSchema(sendOTPSchema), sendOTP);
router.post('/login', validateSchema(loginSchema), login);
router.post('/signup', validateSchema(signupSchema), signup);
// router.post('/verify-email/:token', validateSchema(emailVerificationSchema), verifyEmail);

// Protected routes
router.post('/logout', auth, logout);
router.post('/refresh-token', validateSchema(refreshTokenSchema), refreshToken);

export default router;