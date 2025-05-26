import { Router } from 'express';
import { 
    requestPasswordReset,
    resetPassword,
    changePassword
} from '@/controllers/auth.Controller';
import { auth } from '@/middlewares/auth.middlewares';
import { validateSchema } from '@/middlewares/zodValidation.middleware';
import { 
    passwordResetRequestSchema,
    passwordResetSchema
} from '@/zodSchemas/auth.schema';

const router = Router();

// Public routes -->fronent ke sath test krenga
router.post('/forgot', validateSchema(passwordResetRequestSchema), requestPasswordReset); //forgot password
router.post('/reset', validateSchema(passwordResetSchema), resetPassword); //reset password

// Protected routes
router.post('/change-password', auth, changePassword); //change password

export default router; 