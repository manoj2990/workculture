import { Router } from 'express';
import { auth } from '@/middlewares/auth.middlewares';
import { isAdmin, isSuperAdmin } from '@/middlewares/role.middleware';
import { getAdminLimitsAndUsage, getMyDetails } from '@/controllers/admin.Controller';
const router = Router();

// Admin routes will be added here
router.get('/dashboard', auth, isSuperAdmin, (req, res) => {
    res.status(200).json({ message: 'Admin dashboard' });
});



//get admin details--> pending need recheck
router.get('/mydetails',
    auth,
    isAdmin,
    getMyDetails
)



//get admin limits and usage -->pending need recheck
router.get('/adminLimits', 
    auth, 
    isAdmin, 
    getAdminLimitsAndUsage);



export default router; 