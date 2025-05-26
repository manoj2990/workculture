import { Router } from 'express';
import { 
    getProfile,
    updateProfile,
    updateProfilePicture,
    deleteProfilePicture
} from '@/controllers/profile.Controller';
// import { auth } from '@/middlewares/auth.middlewares';
// import { validateSchema } from '@/middlewares/zodValidation.middleware';
// import { updateProfileSchema } from '@/zodSchemas/user.schema';

const router = Router();

// All routes are protected
// router.get('/', auth, getProfile);
// router.patch('/', auth, validateSchema(updateProfileSchema), updateProfile);
// router.patch('/picture', auth, updateProfilePicture);
// router.delete('/picture', auth, deleteProfilePicture);

export default router; 