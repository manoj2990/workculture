import express from 'express';
import { 
    createDepartment, 
    updateDepartment, 
    getDepartmentById, 
    deleteDepartment,
    getAllDepartments,
    addCourseToDepartment
} from '@/controllers/department.Controller';
import { auth } from '@/middlewares/auth.middlewares';
import { hasaccountType, isAdmin } from '@/middlewares/role.middleware';
import { validateSchema } from '@/middlewares/zodValidation.middleware';

import { departmentSchema, departmentUpdateSchema } from '@/zodSchemas/department.schema';


const router = express.Router({ mergeParams: true });


//add course to department -->pending
router.post('/addCourseDepartment', 
    auth,
    isAdmin,
    
    addCourseToDepartment
);


//create department -->done
router.post('/create', 
    auth, 
    // isAdmin, 
    hasaccountType('admin', 'superadmin'),
    validateSchema(departmentSchema), 
    createDepartment
);


//get all department under org --> peding (may be remove)
router.post('/getall', 
    auth, 
    isAdmin, 
    getAllDepartments
);



//get specific department -->done
router.post('/get', 
    auth, 
    isAdmin, 
    getDepartmentById
);



//update department --> done
router.put('/update', 
    auth, 
    isAdmin,  
    validateSchema(departmentUpdateSchema), 
    updateDepartment
);



//need to revisit--> delete department
router.delete('/delete', 
    auth, 
    isAdmin, 
    deleteDepartment
);




// Update department assignment
// router.put('/update-assignment', 
//     auth, 
//     isAdmin, 
//     updateDepartmentAssignment
// );

export default router; 