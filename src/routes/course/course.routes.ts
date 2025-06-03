import express from 'express';
import { 
    createCourse, 
    // updateCourse, 
    getSingleCourseById, 
    deleteCourse,
    getAdminCourses ,
    editCourse,
    getFullCourseDetails,
    publishCourse,
    getCourseForDigitalHuman
} from '@/controllers/course.Controller';
import { auth } from '@/middlewares/auth.middlewares';
import { isAdmin } from '@/middlewares/role.middleware';
import { validateSchema } from '@/middlewares/zodValidation.middleware';
import { 
    courseCreationSchema, 
    courseSchema, 
    courseUpdateSchema, 
   
} from '@/zodSchemas/course.schema';

const router = express.Router({ mergeParams: true });


//---------------------------------->course routes<--------------------------------

router.post('/getCourseForDigitalHuman', 
    auth, 
    getCourseForDigitalHuman
);

// create course
router.post('/create-course', //testing done
    auth, 
    isAdmin, 
    validateSchema(courseSchema), 
    createCourse
);



//update course
router.patch('/course-update', //testing done
    auth, 
    isAdmin, 
    validateSchema(courseUpdateSchema), 
    editCourse
);



//delete course
router.delete('/course-delete', //testing pending
    auth, 
    isAdmin, 
    deleteCourse
);



//get single course by id
//accountType based reponse sednd krna hoga
router.post('/getAdmin-SpecificCoursebyId', //testing done
    auth, 
    isAdmin,
    getSingleCourseById
);





// Get All Courses Details for Edit
router.post('/getFullCourseDetails', //testing done
    auth, 
    isAdmin, 
    getFullCourseDetails
);



//publish course
router.post('/publish-course', //testing done need to include weights
    auth, 
    isAdmin, 
    publishCourse
);



//---------------------------------->course routes<--------------------------------




//get all courses for admin
router.get('/getAdmin-AllCourses', 
    auth, 
    isAdmin,
    getAdminCourses
);




export default router; 