import { Router } from 'express';
import courseRoutes from './course.routes';
import contentRoutes from './content.routes';
import assessmentRoutes from './assessment.routes';

const router = Router({ mergeParams: true });

// Mount all course-related routes
router.use('/', courseRoutes);
router.use('/', contentRoutes);
router.use('/', assessmentRoutes);



export default router; 