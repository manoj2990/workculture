import { Router } from 'express';
import authRoutes from './auth.routes';
import passwordRoutes from './password.routes';
import profileRoutes from './profile.routes';

const router = Router();

// Mount all auth-related routes
router.use('/', authRoutes); // Authentication routes ->login, signup
router.use('/password', passwordRoutes); // Password management routes ->forgot password, reset password



router.use('/profile', profileRoutes); // Profile management routes ->update profile, delete profile

export default router; 