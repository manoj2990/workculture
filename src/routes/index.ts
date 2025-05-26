import { Application } from 'express';
import { Router } from 'express';
import authRoutes from '@/routes/auth';
import adminRoutes from '@/routes/admin';
import courseRoutes from '@/routes/course';
import superadminRoutes from '@/routes/superadmin';
import employee from '@/routes/employee';
import aiChat from '@/routes/aiChat'
// API version
const API_VERSION = '/api/v1';

// Create main router
const router = Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});


// Mount API routes
router.use(`${API_VERSION}/auth`, authRoutes); //authentication realted routes for all users
router.use(`${API_VERSION}/admin`, adminRoutes); //admin realted routes
router.use(`${API_VERSION}/superadmin`, superadminRoutes); //superadmin realted routes
router.use(`${API_VERSION}/courses`, courseRoutes); //course realted routes
router.use(`${API_VERSION}/employee`, employee); //employee realted routes
router.use(`${API_VERSION}/askAI`,aiChat);

// Export routes configuration
export default function routes(app: Application) {
    app.use('/', router);
}