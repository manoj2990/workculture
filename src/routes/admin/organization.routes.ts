import express from 'express';
import { auth } from '@/middlewares/auth.middlewares';
import { hasaccountType, isAdmin } from '@/middlewares/role.middleware';
import { validateSchema } from '@/middlewares/zodValidation.middleware';

import { createOrganization, 
    getAllOrganizations,
     getOrganizationById, 
     updateOrganization, 
     deleteOrganization } 
     from '@/controllers/organization.Controller';

import {  organizationSchema, updateOrganizationSchema} from '@/zodSchemas/organization.schema';

const router = express.Router();


// Create organization --> done
router.post('/create', 
    auth, 
    // isAdmin, 
    hasaccountType('admin', 'superadmin'),
    validateSchema(organizationSchema), 
    createOrganization
);


// Get all organizations -->done
router.get('/get-all', 
    auth, 
    isAdmin, 
    getAllOrganizations
);


// Get organization by ID -->DONE
router.post('/get', 
    auth,
    isAdmin,
    getOrganizationById
);



// Update organization -->done
router.put('/update', 
    auth, 
    isAdmin,  
    validateSchema(updateOrganizationSchema), 
    updateOrganization
);



// Delete organization --> need to review this
router.delete('/delete', 
    auth, 
    isAdmin, 
    deleteOrganization
);

export default router; 