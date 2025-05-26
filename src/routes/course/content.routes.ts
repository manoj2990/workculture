import express from 'express';
import { auth } from '@/middlewares/auth.middlewares';
import { isAdmin } from '@/middlewares/role.middleware';
import { validateSchema } from '@/middlewares/zodValidation.middleware';

import { 
    updateTopic,
    createTopic,
    deleteTopic,
    createSubtopic,
    updateSubtopic,
    deleteSubtopic,
    } from '@/controllers/courseContent.Controller';

import { upload } from '@/config/multer.config';
import { 
    // subtopicUpdateSchema, 
    // topicIdSchema, 
    topicSchema, 
    topicUpdateSchema,
    subtopicSchema,
    subtopicUpdateSchema,
    } from '@/zodSchemas/content.schema';

const router = express.Router({ mergeParams: true });

// Middleware to handle file uploads and prepare request body
// const handleFileUploads = (req: any, res: any, next: any) => {
//     console.log('📦 Request body:', req.body);
//     console.log('📁 Uploaded files:', req.files);
    
//     // If files are uploaded, add them to the request body
//     if (req.files) {
//         req.body.files = req.files;
//     }
    
//     // Parse JSON strings in the request body
//     try {
//         if (typeof req.body.video === 'string') {
//             req.body.video = JSON.parse(req.body.video);
//         }
//         if (typeof req.body.files === 'string') {
//             req.body.files = JSON.parse(req.body.files);
//         }
//         if (typeof req.body.links === 'string') {
//             req.body.links = JSON.parse(req.body.links);
//         }
//     } catch (error) {
//         console.error('❌ Error parsing JSON:', error);
//         return res.status(400).json({
//             success: false,
//             message: 'Invalid JSON format in request body'
//         });
//     }
    
//     next();
// };



// >>>>>>>>>>>>>>current code for topic and subtopic  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//Topic routes


router.post('/create-Topic',  //testing done
    auth, 
    isAdmin, 
    validateSchema(topicSchema),
    createTopic
);


router.put('/update-topic',  //testing done
    auth, 
    isAdmin, 
    validateSchema(topicUpdateSchema), 
    updateTopic
);


router.delete('/delete-topic', //testing done
    auth, 
    isAdmin, 
    deleteTopic
);



//Subtopic routes
router.post('/create-subtopic',  //testing done --> need to revisit
    auth, 
    isAdmin,
    upload.any(),
    validateSchema(subtopicSchema), 
    createSubtopic
);



router.put('/update-subtopic', //testing done
    auth, 
    isAdmin, 
    upload.any(),
    validateSchema(subtopicUpdateSchema), 
    updateSubtopic
);


router.delete('/delete-subtopic', //testing done
    auth,
    isAdmin,
    deleteSubtopic
);






























///>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Topic routes
// router.post('/create-course-content', 
//     auth, 
//     isAdmin, 
//     upload.any(), // Accept any file upload
//     handleFileUploads,
//     validateSchema(courseContentSchema), 
//     createCourseContent
// );




// Subtopic routes
// router.put('/update-subtopic', 
//     auth, 
//     isAdmin, 
//     upload.any(), 
//     handleFileUploads,
//     validateSchema(subtopicUpdateSchema), 
//     updateSubtopic
// );








// router.delete('/topics/:topicId', 
//     auth, 
//     isAdmin, 
//     validateSchema(topicIdSchema), 
//     deleteTopic
// );





// Subtopic routes
// router.post('/subtopics', 
//     auth, 
//     isAdmin, 
//     validateSchema(subtopicSchema), 
//     createSubtopic
// );

// router.put('/subtopics/:subtopicId', 
//     auth, 
//     isAdmin, 
//     // validateSchema(subtopicIdSchema),
//     validateSchema(subtopicSchema), 
//     updateSubtopic
// );

// router.delete('/subtopics/:subtopicId', 
//     auth, 
//     isAdmin, 
//     validateSchema(subtopicIdSchema), 
//     deleteSubtopic
// );



export default router; 