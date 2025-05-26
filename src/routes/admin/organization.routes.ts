import express from 'express';
import { auth } from '@/middlewares/auth.middlewares';
import { isAdmin } from '@/middlewares/role.middleware';
import { validateSchema } from '@/middlewares/zodValidation.middleware';

import { createOrganization, 
    getAllOrganizations,
     getOrganizationById, 
     updateOrganization, 
     deleteOrganization } 
     from '@/controllers/organization.Controller';

import {  organizationSchema } from '@/zodSchemas/organization.schema';

const router = express.Router();


// Create organization --> done
router.post('/create', 
    auth, 
    isAdmin, 
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
router.get('/get', 
    auth,
    isAdmin,
    getOrganizationById
);



// Update organization -->done
router.put('/update', 
    auth, 
    isAdmin,  
    validateSchema(organizationSchema), 
    updateOrganization
);



// Delete organization --> need to review this
router.delete('/delete', 
    auth, 
    isAdmin, 
    deleteOrganization
);

export default router; 