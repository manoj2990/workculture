import express from 'express';
import { 
    createCourseAssessments,
    deleteAssessment,
    getAssessmentWithUserAnswers,
    updateAssessment,
    saveCourseAssessments
} from '@/controllers/courseAssessment.Controller';
import { auth } from '@/middlewares/auth.middlewares';
import { hasaccountType, isAdmin, isEmployee } from '@/middlewares/role.middleware';
import { validateSchema } from '@/middlewares/zodValidation.middleware';
import { 
    assessmentCreationSchema,
    assessmentUpdateSchema,
    assessmentIdSchema
} from '@/zodSchemas/assessment.schema';

const router = express.Router({ mergeParams: true });


router.post('/save-CourseAssessments',  //testing done
    auth, 
    isAdmin, 
    saveCourseAssessments
);

// Admin routes
router.post('/course-assessments',  //testing done
    auth, 
    isAdmin, 
    validateSchema(assessmentCreationSchema), 
    createCourseAssessments
);


////get Assessment by id when emp open Assessment with UserAnswers --> done
router.post('/getAssessmentWithUserAnswers',
    auth,
    hasaccountType('admin', 'employee'),
    getAssessmentWithUserAnswers
)



//delete the assesment
router.delete('/delete-assessment',  //testing done
    auth, 
    isAdmin, 
    deleteAssessment
);



// Update Assessment -> testing pending
//You can update just the metadata, just the questions, or both -> done
// Question Management:
// Existing questions are updated if they have an _id -> done
// New questions are created if they don't have an _id -> done
// Questions not included in the update are automatically removed -> done
// Maintains question order -> done
router.patch('/update-assessment', // tesing done
    auth, 
    isAdmin, 
    validateSchema(assessmentUpdateSchema), 
    updateAssessment
);

export default router; 