import { Router } from 'express';
import superadminRoutes from './superadmin.routes';

const router = Router();

// Mount all superadmin-related routes
router.use('/', superadminRoutes); // Admin management routes

export default router;