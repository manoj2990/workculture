import { Router } from 'express';
import adminRoutes from './admin.routes';
import departmentRoutes from './department.routes';
import organizationRoutes from './organization.routes';
import employeeRoutes from './employee.routes';
import courseRequest from './courseRequest.routes'
import registrationRequest from './registrationRequest.routes'
const router = Router({ mergeParams: true });

// Mount all admin-related routes
router.use('/', adminRoutes); // Base admin routes (dashboard, etc.)
router.use('/organizations', organizationRoutes); // Organization management
router.use('/department', departmentRoutes); // Department management
router.use('/employees', employeeRoutes); // Employee management
router.use('/course-request', courseRequest); // Access request to manage course access
router.use('/registration-request', registrationRequest); // Registration request to manage registration access

export default router;