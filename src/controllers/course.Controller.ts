import { Request, Response } from 'express';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiError from '@/utils/apiError.utils';
import ApiResponse from '@/utils/apiResponse.utils';
import CourseModel from '@/models/course.model';
import OrganizationModel from '@/models/organization.model';
import DepartmentModel from '@/models/department.model';

import mongoose, { Schema, Types } from 'mongoose';
import { ICourse } from '@/types/course.types';
import { ICourseEditResponse, IPopulatedCourseForEdit } from '@/types/courseEdit.types';
import AdminLimitsUtils from '@/utils/adminLimits.utils';
import CourseSummaryService from '@/services/CourseSummary.service';
import courseProgressModel from '@/models/courseProgress.model';
import { IUser } from '@/types/user.types';

interface PopulatedEnrolledEmployee {
    _id: string;
    name: string;
    email: string;
}

interface PopulatedCourse extends Omit<ICourse, 'enrolledEmployees' | '_id'> {
    _id: string;
    enrolledEmployees: PopulatedEnrolledEmployee[];
    
}


//---------------------------------->course controller<--------------------------------
// Create Course

export const getCourseForDigitalHuman = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.body;
    const userId = req.user?._id;
    const userRole = req.user?.accountType;

    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    if (!courseId) {
        throw new ApiError(400, "Course ID is required");
    }

    let courseQuery: any = { _id: courseId };

    if (userRole === "admin") {
        const allowedOrgs = await OrganizationModel.find({ admin: userId }).distinct("_id");
        if (!allowedOrgs.length) {
            throw new ApiError(403, "No organizations found for this admin");
        }
        courseQuery["linked_entities.organization"] = { $in: allowedOrgs };
    } else if (userRole === "employee") {
        courseQuery["enrolledEmployees"] = userId;
    } else {
        throw new ApiError(403, "Invalid user role");
    }

    const course = await CourseModel.findOne(courseQuery)
        .populate({
            path: "topics",
            populate: {
                path: "subtopics",
                populate: {
                    path: "assessments",
                    select: "_id assessments_title", // Changed 'title' to 'assessments_title'
                },
            },
        })
        .lean();

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const formattedCourse = {
        id: course._id.toString(),
        title: course.title,
        topics: course.topics.map((topic: any) => ({
            id: topic._id.toString(),
            title: topic.title,
            subTopics: topic.subtopics.map((subtopic: any) => {
                const subTopic: any = {
                    id: subtopic._id.toString(),
                    title: subtopic.title,
                    type: subtopic.contentType === "file" ? "download" : subtopic.contentType,
                };

              
                if (subtopic.contentType === "text") {
                    subTopic.content = subtopic.text_content;
               
                    if (subtopic.imageUrl) {
                        subTopic.imageUrl = subtopic.imageUrl.url;
                    }
                    if(subtopic.audioUrl){
                        subTopic.audioUrl = subtopic.audioUrl.url;
                    }
                } else if (subtopic.contentType === "video") {
                    subTopic.videoUrl = subtopic.video?.url || "";
                } else if (subtopic.contentType === "file") {
                    subTopic.files = subtopic.files?.map((file: any) => ({
                        url: file.url || "",
                        name: file.name || "",
                        type: file.type || "",
                    })) || [];
                } else if (subtopic.contentType === "link") {
                    subTopic.links = subtopic.links?.map((link: any) => ({
                        title: link.title || "",
                        url: link.url || "",
                    })) || [];
                }

       
                subTopic.assessmentIds = subtopic.assessments?.length
                    ? subtopic.assessments.map((assessment: any) => ({
                          id: assessment._id.toString(),
                          title: assessment.assessments_title || `Assessment ${assessment._id}`, // Use assessments_title
                      }))
                    : [];

                return subTopic;
            }),
        })),
    };

    return new ApiResponse(200, formattedCourse, "Course details fetched successfully").send(res);
});















export const createCourse = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    // Create course
    const course = await CourseModel.create([{
        ...validatedData,
        createdByAdmin: adminId,
        linked_entities: [],
        enrolledEmployees: [],
        topics: []
    }]);

    return new ApiResponse(201, {
        course: {
            _id: course[0]._id,
            title: course[0].title,
            description: course[0].description,
            duration: course[0].duration,
            skills: course[0].skills,
            image_url: course[0].image_url,
            instructors: course[0].instructors,
            linked_entities: course[0].linked_entities,
            ai_settings: course[0].ai_settings,
            topics: course[0].topics,
            enrolledEmployees: course[0].enrolledEmployees,
            createdByAdmin: course[0].createdByAdmin,
            status: course[0].status
        }
    }, 'Course created successfully').send(res);
});





// Edit Course
export const editCourse = asyncHandler(async (req: Request, res: Response) => {
    const {
        courseId,
        title,
        description,
        duration,
        skills,
        image_url,
        instructors,
        status,
        ai_settings
    } = req.body;

    const adminId = req.user?._id;
    if (!adminId) throw new ApiError(401, 'Unauthorized access');
    if (!courseId) throw new ApiError(400, 'Course ID is required');

    
    const course = await CourseModel.findById(courseId);
    if (!course) throw new ApiError(404, 'Course not found');

    // Build update object with only basic course information
    const updateFields: any = {
        ...(title && { title }),
        ...(description && { description }),
        ...(duration && { duration }),
        ...(skills && { skills }),
        ...(image_url && { image_url }),
        ...(instructors && { instructors }),
        ...(status && { status }),
        ...(ai_settings && { ai_settings })
    };

    // Apply update
    const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: updateFields },
        { new: true }
    ).select('title description duration skills image_url instructors status ai_settings createdAt updatedAt');

    return new ApiResponse(200, { course: updatedCourse }, 'Course updated successfully').send(res);
});






// Delete Course --> need to revisit
//need to delete topic->subtopic->resources->ass->questions
export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    const course = await CourseModel.findOneAndDelete({
        _id: courseId,
        'linked_entities.organization': { 
            $in: await OrganizationModel.find({ admin: adminId }).distinct('_id') 
        }
    });

    if (!course) {
        throw new ApiError(404, 'Course not found or access denied');
    }

    // Remove course from departments
    await DepartmentModel.updateMany(
        { courses: courseId },
        { $pull: { courses: courseId } }
    );

    return new ApiResponse(200, { message: 'Course deleted successfully' }).send(res);
});






//get single course by id
// Get single course full details by ID--> to show admin for perticular organization
//1. course process add krna hai
//2. employee ko kan enroll kiya date & status add krna hai

//--> get cousrse all details for department


//get course details for admin

export const getSingleCourseById = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!courseId) {
        throw new ApiError(400, 'Course ID is required');
    }

    // Get all organizations owned by admin
    const allowedOrgs = await OrganizationModel.find({ admin: adminId }).distinct('_id');

    // Find and populate course with all necessary data
    const course = await CourseModel.findOne({
        _id: courseId,
        'linked_entities.organization': { $in: allowedOrgs }
    })
    .populate('linked_entities.organization', 'name')
    .populate('linked_entities.departments', 'name')
    .populate({
        path: 'topics',
        populate: {
            path: 'subtopics',
            populate: [
                {
                    path: 'assessments',
                    populate: {
                        path: 'questions',
                        select: 'questionText questionType options correctAnswers sampleAnswer instructions order'
                    }
                }
            ]
        }
    })
    .populate('createdByAdmin', 'name email')
    .populate<{ enrolledEmployees: PopulatedEnrolledEmployee[] }>('enrolledEmployees', 'name email')
    .lean();

    if (!course) {
        throw new ApiError(404, 'Course not found or access denied');
    }

    // Get course summary statistics
    const courseSummary = await CourseSummaryService.getCourseSummaryForAdmin(courseId);
    if (!courseSummary) {
        throw new ApiError(404, 'Course summary not found');
    }

    // Get progress for enrolled employees
    const typedCourse = course as unknown as PopulatedCourse;

    const enrolledEmployeeIds = (typedCourse.enrolledEmployees || []).map(emp => emp._id);
    
    const employeeProgress = await courseProgressModel.find({
        courseId: courseId,
        userId: { $in: enrolledEmployeeIds }
    })
    .populate('userId', 'name email')
    .lean();

    // Create a map of employee progress for efficient lookup
    const progressMap = employeeProgress.reduce((map, progress) => {
        if (progress.userId && typeof progress.userId === 'object' && '_id' in progress.userId) {
            const userId = progress.userId._id.toString();
            map[userId] = {
                completedTopics: progress.completedTopics,
                completedSubtopics: progress.completedSubtopics,
                completedAssignments: progress.completedAssignments,
                completedQuestions: progress.completedQuestions,
                progressPercent: progress.progressPercent,
                status: progress.status,
                lastUpdated: progress.lastUpdated
            };
        }
        return map;
    }, {} as Record<string, any>);

    // Format the response data
    const formattedResponse = {
        // Basic Info
        _id: typedCourse._id,
        title: typedCourse.title,
        description: typedCourse.description,
        duration: typedCourse.duration,
        skills: typedCourse.skills,
        image_url: typedCourse.image_url,
        instructors: typedCourse.instructors,
        status: typedCourse.status,
        createdAt: typedCourse.createdAt,
        updatedAt: typedCourse.updatedAt,
        courseSummary,

        // Organization & Department Info
        linked_entities: typedCourse.linked_entities.map(entity => ({
            organization: {
                _id: entity.organization._id.toString(),
                name: entity.organization.name
            },
            departments: entity.departments.map(dept => ({
                _id: dept._id.toString(),
                name: dept.name
            }))
        })),

        // AI Settings
        ai_settings: typedCourse.ai_settings ? {
            persona_prompt: typedCourse.ai_settings.persona_prompt,
            ability_prompt: typedCourse.ai_settings.ability_prompt,
            rag_documents: typedCourse.ai_settings.rag_documents?.map(doc => ({
                name: doc.name,
                url: doc.url,
                vectorized: doc.vectorized
            }))
        } : null,

        // Course Curriculum
        curriculum: typedCourse.topics.map(topic => ({
            _id: topic._id,
            title: topic.title,
            description: topic.description,
            order: topic.order,
            subtopics: topic.subtopics.map(subtopic => ({
                _id: subtopic._id,
                title: subtopic.title,
                description: subtopic.description,
                order: subtopic.order,
                contentType: subtopic.contentType,
                content: {
                    text: subtopic.text_content,
                    video: subtopic.video,
                    files: subtopic.files,
                    links: subtopic.links
                },
                assessments: subtopic.assessments?.map(assessment => ({
                    _id: assessment._id,
                    title: assessment.assessments_title,
                    order: assessment.order,
                    questions: assessment.questions.map(question => ({
                        _id: question._id,
                        questionText: question.questionText,
                        questionType: question.questionType,
                        options: question.options,
                        correctAnswers: question.correctAnswers,
                        sampleAnswer: question.sampleAnswer,
                        instructions: question.instructions,
                        order: question.order
                    }))
                }))
            }))
        })),

        // Admin & Enrollment Info
        createdByAdmin: {
            _id: typedCourse.createdByAdmin._id,
            name: typedCourse.createdByAdmin.name,
            email: typedCourse.createdByAdmin.email
        },
        enrolledEmployees: (typedCourse.enrolledEmployees || []).map(emp => ({
            _id: emp._id,
            name: emp.name,
            email: emp.email,
            progress: progressMap[emp._id.toString()] || null
        }))
    };

    return new ApiResponse(200, formattedResponse, 'Course details fetched successfully').send(res);
});










export const getFullCourseDetails = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.body;
    const adminId = req.user?._id;

    // Input validation
    if (!courseId) {
        throw new ApiError(400, 'Course ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new ApiError(400, 'Invalid course ID format');
    }

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    // Get all organizations owned by admin
    const allowedOrgs = await OrganizationModel.find({ admin: adminId }).distinct('_id');
    if (!allowedOrgs.length) {
        throw new ApiError(403, 'No organizations found for this admin');
    }

    // Find and populate course with optimized query
    const course = await CourseModel.findOne({
        _id: courseId,
        'linked_entities.organization': { $in: allowedOrgs }
    })
    .select('title description duration skills image_url instructors status ai_settings linked_entities topics')
    .populate('linked_entities.organization', 'name')
    .populate('linked_entities.departments', 'name')
    .populate({
        path: 'topics',
        select: 'title description order subtopics',
        populate: {
            path: 'subtopics',
            select: 'title description order contentType text_content video files links assessments',
            populate: [
                {
                    path: 'assessments',
                    select: 'assessments_title order questions',
                    populate: {
                        path: 'questions',
                        select: 'questionText questionType options correctAnswers sampleAnswer instructions order'
                    }
                }
            ]
        }
    })
    .lean();

    if (!course) {
        throw new ApiError(404, 'Course not found or access denied');
    }

    const typedCourse = course as unknown as IPopulatedCourseForEdit;

    // Format response with proper typing
    const formattedResponse: ICourseEditResponse = {
        // Basic Course Information
        basicInfo: {
            _id: typedCourse._id,
            title: typedCourse.title,
            description: typedCourse.description,
            duration: typedCourse.duration,
            skills: typedCourse.skills || [],
            image_url: typedCourse.image_url,
            instructors: typedCourse.instructors,
            status: typedCourse.status,
            organizations: typedCourse.linked_entities.map(entity => ({
                _id: entity.organization._id.toString(),
                name: entity.organization.name,
                departments: entity.departments.map(dept => ({
                    _id: dept._id.toString(),
                    name: dept.name
                }))
            }))
        },

        // AI Settings
        aiSettings: {
            persona_prompt: typedCourse.ai_settings?.persona_prompt || '',
            ability_prompt: typedCourse.ai_settings?.ability_prompt || '',
            rag_documents: typedCourse.ai_settings?.rag_documents?.map(doc => ({
                name: doc.name,
                url: doc.url,
                vectorized: doc.vectorized
            })) || []
        },

        // Course Content Structure
        content: typedCourse.topics.map(topic => ({
            _id: topic._id,
            title: topic.title,
            description: topic.description,
            order: topic.order,
            subtopics: topic.subtopics.map(subtopic => ({
                _id: subtopic._id,
                title: subtopic.title,
                description: subtopic.description,
                order: subtopic.order,
                contentType: subtopic.contentType,
                content: {
                    text: subtopic.text_content,
                    video: subtopic.video,
                    files: subtopic.files || [],
                    links: subtopic.links || []
                }
            }))
        })),

        // Assessments Structure
        assessments: typedCourse.topics.flatMap(topic => 
            topic.subtopics.flatMap(subtopic => 
                subtopic.assessments?.map(assessment => ({
                    topicId: topic._id,
                    topicTitle: topic.title,
                    subtopicId: subtopic._id,
                    subtopicTitle: subtopic.title,
                    _id: assessment._id,
                    title: assessment.assessments_title,
                    order: assessment.order || 0,
                    questions: assessment.questions.map(question => ({
                        _id: question._id,
                        questionText: question.questionText,
                        questionType: question.questionType,
                        options: question.options || [],
                        correctAnswers: question.correctAnswers || [],
                        sampleAnswer: question.sampleAnswer,
                        instructions: question.instructions,
                        order: question.order
                    }))
                })) || []
            )
        ).filter(Boolean)
    };

    return new ApiResponse(200, formattedResponse, 'Course edit data fetched successfully').send(res);
});









//publish course
export const publishCourse = asyncHandler(async (req: Request, res: Response) => {
    const { courseId, linked_entities, status } = req.body;
    const adminId = req.user?._id;
    const accessToken = req.user?.accessToken

    if (!courseId) {
        throw new ApiError(400, 'Course ID is required');
    }

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new ApiError(400, 'Invalid course ID format');
    }

    // Validate status
    if (status && !['published', 'draft'].includes(status)) {
        throw new ApiError(400, 'Invalid status. Must be either "published" or "draft"');
    }


    //check admin limits
    const adminLimits = await AdminLimitsUtils.canCreateCourse(adminId as unknown as Types.ObjectId);
    if (!adminLimits.isAllowed) {
        throw new ApiError(400, adminLimits.message);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the course
        const course = await CourseModel.findOne({
            _id: courseId
        }).session(session);

        if (!course) {
            throw new ApiError(404, 'Course not found or access denied');
        }

        // Validate course content before publishing
        if (status === 'published') {
            // Check if course has at least one topic
            // if (!course.topics || course.topics.length === 0) {
            //     throw new ApiError(400, 'Cannot publish course without any topics or subtopics');
            // }

            // Check if linked entities are provided for publishing
            if (!linked_entities || linked_entities.length === 0) {
                throw new ApiError(400, 'Cannot publish course without linking to organizations and departments');
            }

            // Validate linked entities
            for (const entity of linked_entities) {
                if (!entity.organization || !entity.departments || entity.departments.length === 0) {
                    throw new ApiError(400, 'Invalid linked entities structure');
                }

                // Validate organization exists
                const org = await OrganizationModel.findById(entity.organization).session(session);
                if (!org) {
                    throw new ApiError(404, `Organization ${entity.organization} not found`);
                }

                // Validate departments exist and belong to the organization
                for (const dept of entity.departments) {
                    const department = await DepartmentModel.findById(dept._id).session(session);
                    if (!department) {
                        throw new ApiError(404, `Department ${dept._id} not found`);
                    }
                    if (department.organization.toString() !== entity.organization) {
                        throw new ApiError(400, `Department ${dept._id} does not belong to organization ${entity.organization}`);
                    }
                }
            }
        }

        // Update course status and linked entities
        const updateData: any = {
            status: status || 'published'
        };

        // Only update linked_entities if provided and status is published
        if (linked_entities && status === 'published') {
            updateData.linked_entities = linked_entities;
        }

        const updatedCourse = await CourseModel.findByIdAndUpdate(
            courseId,
            { $set: updateData },
            { new: true, session }
        ).select('title status linked_entities');

        if (!updatedCourse) {
            throw new ApiError(500, 'Failed to update course status');
        }

        // If course is being published, update departments' courses array
        if (status === 'published') {
            for (const entity of linked_entities) {
                for (const dept of entity.departments) {
                    // Add course to department if not already present
                    await DepartmentModel.findByIdAndUpdate(
                        dept._id,
                        { 
                            $addToSet: { courses: courseId } // Using $addToSet to prevent duplicates
                        },
                        { session }
                    );
                }
            }
        } else if (status === 'draft') {
            // If course is being unpublished, remove it from all departments
            for (const entity of course.linked_entities || []) {
                for (const deptId of entity.departments) {
                    await DepartmentModel.findByIdAndUpdate(
                        deptId,
                        { 
                            $pull: { courses: courseId }
                        },
                        { session }
                    );
                }
            }
        }

        await session.commitTransaction();
        session.endSession();

        const message = status === 'published' 
            ? 'Course published successfully' 
            : 'Course unpublished successfully';

            const link = `http://localhost:8080/course/${courseId}/${accessToken}`
           
        return new ApiResponse(200, {
            course: {
                _id: updatedCourse._id,
                title: updatedCourse.title,
                status: updatedCourse.status,
                linked_entities: updatedCourse.linked_entities
            },
            courseLink: link
        }, message).send(res);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});














//---------------------------------->course controller<--------------------------------



// export const editCourse = asyncHandler(async (req: Request, res: Response) => {
//     const { courseId } = req.params;
//     const { title, description, duration, skills, image_url, instructors, status } = req.body;

//     const adminId = req.user?._id;

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }       

//     if (!courseId) {
//         throw new ApiError(400, 'Course ID is required');
//     }
    
//     const course = await CourseModel.findOne({
//         _id: courseId,
//         'linked_entities.organization': { $in: await OrganizationModel.find({ admin: adminId }).distinct('_id') }
//     });

//     if (!course) {
//         throw new ApiError(404, 'Course not found');
//     }

//     // if (title && title !== course.title) {
//     //     const duplicateCourse = await CourseModel.findOne({
//     //         title: { $regex: new RegExp(`^${title}$`, 'i') },
//     //         'linked_entities.organization': course.linked_entities[0].organization,
//     //         _id: { $ne: courseId }
//     //     });
        
//     // }

//     const updatedCourse = await CourseModel.findByIdAndUpdate(
//         courseId,
//         {
//             $set: {
//                 ...(title && { title }),
//                 ...(description && { description }),    
//                 ...(duration && { duration }),
//                 ...(skills && { skills }),
//                 ...(image_url && { image_url }),
//                 ...(instructors && { instructors }),
//                 ...(status && { status })
//             }
//         },
//         { new: true }
//     ).select('title description duration skills image_url instructors status createdAt updatedAt');

//     return new ApiResponse(200, {
//         course: updatedCourse
//     }, 'Course updated successfully').send(res);

// });












// // Get All Courses 

export const getAdminCourses = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user?._id;
  const accessToken = req.user?.accessToken

  if (!adminId) {
      throw new ApiError(401, 'Unauthorized access');
  }

  // Get all organizations created by the admin
  const orgIds = await OrganizationModel.find({ admin: adminId }).distinct('_id');

  let courses = await CourseModel.find({
      'linked_entities.organization': { $in: orgIds }
  })
  .populate({
      path: 'linked_entities.departments',
      select: 'name'
  })
  .populate({
      path: 'linked_entities.organization',
      select: 'name'
  })
  .populate({
      path: 'enrolledEmployees',
      select: 'name email'
  })
  .select('title description duration image_url status createdAt updatedAt linked_entities instructors enrolledEmployees');


  courses = courses.map((course: any) => {
        const courseObj = course.toObject();
        if (course.status === 'published') {
            courseObj.courseLink = `http://localhost:8080/course/${course._id}/${accessToken}`;
        }
        return courseObj;
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return new ApiResponse(200, {
        courses
    }, 'Courses fetched successfully').send(res);

});








// Get sigale Course full details for Edit
// Returns all necessary data for course editing form



// Dummy data for getCourseForEdit
// export const dummyCourseEditData = {
//     basicInfo: {
//         title: "Introduction to Web Development",
//         description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript",
//         duration: "8 weeks",
//         skills: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
//         image_url: "https://example.com/course-image.jpg",
//         instructors: ["John Doe", "Jane Smith"],
//         organizations: [
//             {
//                 _id: "65f1a2b3c4d5e6f7g8h9i0j1",
//                 name: "Tech Academy",
//                 departments: [
//                     {
//                         _id: "65f1a2b3c4d5e6f7g8h9i0j2",
//                         name: "Web Development"
//                     },
//                     {
//                         _id: "65f1a2b3c4d5e6f7g8h9i0j3",
//                         name: "Software Engineering"
//                     }
//                 ]
//             }
//         ]
//     },
//     aiSettings: {
//         persona_prompt: "You are a friendly and knowledgeable web development instructor",
//         ability_prompt: "Help students understand web development concepts and solve coding problems",
//         rag_documents: [
//             {
//                 name: "Web Development Basics",
//                 url: "https://example.com/docs/web-dev-basics.pdf",
//                 vectorized: true
//             },
//             {
//                 name: "JavaScript Best Practices",
//                 url: "https://example.com/docs/js-best-practices.pdf",
//                 vectorized: true
//             }
//         ]
//     },
//     content: [
//         {
//             _id: "65f1a2b3c4d5e6f7g8h9i0j4",
//             title: "HTML Fundamentals",
//             description: "Learn the basics of HTML structure and elements",
//             subtopics: [
//                 {
//                     _id: "65f1a2b3c4d5e6f7g8h9i0j5",
//                     title: "HTML Document Structure",
//                     description: "Understanding the basic structure of an HTML document",
//                     modules: [
//                         {
//                             _id: "65f1a2b3c4d5e6f7g8h9i0j6",
//                             type: "text",
//                             content: "HTML documents are structured with a DOCTYPE declaration, html, head, and body elements...",
//                             attachments: [
//                                 {
//                                     name: "HTML Structure Example",
//                                     url: "https://example.com/attachments/html-structure.html",
//                                     size: 1024
//                                 }
//                             ]
//                         },
//                         {
//                             _id: "65f1a2b3c4d5e6f7g8h9i0j7",
//                             type: "video",
//                             content: "https://example.com/videos/html-basics.mp4",
//                             attachments: []
//                         }
//                     ]
//                 }
//             ]
//         },
//         {
//             _id: "65f1a2b3c4d5e6f7g8h9i0j8",
//             title: "CSS Styling",
//             description: "Learn how to style web pages using CSS",
//             subtopics: [
//                 {
//                     _id: "65f1a2b3c4d5e6f7g8h9i0j9",
//                     title: "CSS Selectors and Properties",
//                     description: "Understanding CSS selectors and common properties",
//                     modules: [
//                         {
//                             _id: "65f1a2b3c4d5e6f7g8h9i0k0",
//                             type: "text",
//                             content: "CSS selectors are patterns used to select the elements you want to style...",
//                             attachments: []
//                         }
//                     ]
//                 }
//             ]
//         }
//     ],
//     assessments: [
//         {
//             topicId: "65f1a2b3c4d5e6f7g8h9i0j4",
//             topicTitle: "HTML Fundamentals",
//             subtopicId: "65f1a2b3c4d5e6f7g8h9i0j5",
//             subtopicTitle: "HTML Document Structure",
//             _id: "65f1a2b3c4d5e6f7g8h9i0k1",
//             questions: [
//                 {
//                     _id: "65f1a2b3c4d5e6f7g8h9i0k2",
//                     questionText: "What is the purpose of the DOCTYPE declaration in HTML?",
//                     questionType: "multiple_choice",
//                     options: [
//                         { value: "a", label: "To define the document type" },
//                         { value: "b", label: "To specify the character encoding" },
//                         { value: "c", label: "To link external stylesheets" },
//                         { value: "d", label: "To declare JavaScript functions" }
//                     ],
//                     correctAnswers: ["a"],
//                     instructions: "Select the most appropriate answer"
//                 },
//                 {
//                     _id: "65f1a2b3c4d5e6f7g8h9i0k3",
//                     questionText: "Explain the difference between block and inline elements in HTML",
//                     questionType: "descriptive",
//                     sampleAnswer: "Block elements start on a new line and take up the full width available...",
//                     instructions: "Write a detailed explanation with examples"
//                 }
//             ]
//         }
//     ],
//     status: "draft"
// }; 

 