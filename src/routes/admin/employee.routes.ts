import { Router } from 'express';
import { 
    addEmployeeToDepartment,
    getEmployeeEnrolledCourses,
    // saveEmployeeAnswer,
} from '@/controllers/employee.Controller';
import { auth } from '@/middlewares/auth.middlewares';
import { isAdmin, isEmployee } from '@/middlewares/role.middleware';


const router = Router();



//add emp to department from other department --> pending
router.post('/addEmployeedepartment', 
    auth,
    isAdmin,
    addEmployeeToDepartment
);














///---------------------------------------------->



// // Create employee
// router.post('/', 
//     auth, 
//     isAdmin, 
//     validateRequest(['email', 'firstName', 'lastName', 'department']), 
//     createEmployee
// );

// // Get all employees
// router.get('/', 
//     auth, 
//     isAdmin, 
//     getEmployees
// );

// // Get employee by ID
// router.get('/:id', 
//     auth, 
//     isAdmin, 
//     getEmployeeById
// );

// // Update employee
// router.put('/:id', 
//     auth, 
//     isAdmin, 
//     validateRequest(['firstName', 'lastName', 'department']), 
//     updateEmployee
// );

// // Delete employee
// router.delete('/:id', 
//     auth, 
//     isAdmin, 
//     deleteEmployee
// );

export default router; 