import { Router } from 'express';

import { 
    updateAdminLimits,
    getAllAdmins,
    getAdminById,
    updateAdminInformation,
    } from '@/controllers/superadmin.Controller';
import { auth } from '@/middlewares/auth.middlewares';
import { isSuperAdmin } from '@/middlewares/role.middleware';
import { signupSchema } from '@/zodSchemas/auth.schema';
import { validateSchema } from '@/middlewares/zodValidation.middleware';

import { signup } from '@/controllers/auth.Controller';
import { updateAdminLimitsSchema, updateAdminSchema } from '@/zodSchemas/user.schema';

const router = Router();

//--->Admin Management Routes
//create admin --> done
router.post('/create-admin', 
    auth, 
    isSuperAdmin, 
    validateSchema(signupSchema), 
    signup
);

//get all admins --> done
router.get('/admins', 
    auth, 
    isSuperAdmin, 
    getAllAdmins
);

//get admin by id
// router.post('/get-admin', 
//     auth, 
//     isSuperAdmin, 
//     getAdminDetails
// );


//get specific admin --> done
router.post('/get-admin-by-id', 
    auth, 
    isSuperAdmin, 
    getAdminById
);




//update admin limits --> done
router.put('/update-admin-limits', 
    auth, 
    isSuperAdmin, 
    validateSchema(updateAdminLimitsSchema),
    updateAdminLimits
);








//Update Admin -->done
router.put('/update-admin', 
    auth, 
    isSuperAdmin, 
    validateSchema(updateAdminSchema), 
    updateAdminInformation
);

// >>>>>>>>>>>>>>Delete Admin--> need to delete all departments,courses,users,organization
// router.delete('/admins/:id', 
//     auth, 
//     isSuperAdmin, 
//     deleteAdmin
// );






export default router; 