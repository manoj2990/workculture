import express from 'express';
import {  isAdmin } from '@/middlewares/role.middleware';
import { auth } from '@/middlewares/auth.middlewares';
import {
    getSingleCourseAccessRequestbyorganization,
    handleCourseAccessRequest,
    updateSingleAccessRequest
} from '@/controllers/courseAccessRequest';

const router = express.Router();

// Get all access requests
router.post('/get/courseAccessRequests',  //testing done
    auth, 
    isAdmin, 
    getSingleCourseAccessRequestbyorganization
);


router.post('/bulk/handle',  //testing done
    auth, 
    isAdmin, 
    handleCourseAccessRequest
);


//update single req
router.post('/single/update',  //testing done
    auth,
    isAdmin,
    updateSingleAccessRequest
)

export default router; 