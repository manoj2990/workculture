

import { Router } from 'express';
import courseRequestRoutes from './courseRequest.routes';

const router = Router({ mergeParams: true });

// Mount all employee-related routes
router.use('/course', courseRequestRoutes);
// router.use('/profile',empProfile)



export default router; 