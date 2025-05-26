import { auth } from "@/middlewares/auth.middlewares";
import { isEmployee } from "@/middlewares/role.middleware";
import { Router } from "express";


import { getEmployeeEnrolledCourses, requestCoursesAccess, saveUserAnswerAndUpdateProgress,getallCourseUnderOrg } from "@/controllers/employee.Controller";
import {updateProgress} from "@/controllers/courseProgress.controller"



const router = Router({ mergeParams: true });


//send course access req--> done
router.post('/request',
    auth,
    isEmployee,
    requestCoursesAccess
)


//get all course under org +depart of emp--> done
router.get('/getcourse',
    auth,
    isEmployee,
    getallCourseUnderOrg
)


//get Employee Enrolled all Courses -->peding(need improve acc to UI)
router.get('/employeeEnrolledCourses',
    auth,
    isEmployee,
    getEmployeeEnrolledCourses
)



//save Employee Answer for question --> pending
router.post('/saveAnswer',
    auth,
    isEmployee,
    saveUserAnswerAndUpdateProgress
)


//update course progress of employee
router.post('/updateProgress',
    auth,
    isEmployee,
    updateProgress
)



export default router;
