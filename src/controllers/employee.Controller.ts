import userModel from "@/models/user.model";
import departmentModel from "@/models/department.model";
import ApiError from "@/utils/apiError.utils";
import asyncHandler from "@/utils/asyncHandler.utils";
import { Request, Response } from "express";
import ApiResponse from "@/utils/apiResponse.utils";
import mongoose from "mongoose";
import OrganizationModel from "@/models/organization.model";
import courseModel from "@/models/course.model";
import accessRequestModel from "@/models/accessRequest.model";
import courseProgressModel from "@/models/courseProgress.model";
import userAnswerModel from "@/models/userAnswer.model";
import CourseSummaryService from "@/services/CourseSummary.service";
import { uploadOnCloudinary } from "@/utils/cloudinary.utils";
import { any } from "zod";
import { ICourse, ITopic, ISubtopic, Iassessments, IQuestion } from "@/types/index"




//add employee to department --> revisit
export const addEmployeeToDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, departmentId } = req.body;
    const adminId = req.user?._id;

    // Input validation
    if (!employeeId || !departmentId) {
        throw new ApiError(400, 'Employee ID and Department ID are required');
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(departmentId)) {
        throw new ApiError(400, 'Invalid ID format');
    }

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    // Check if employee exists and is actually an employee
    const employee = await userModel.findOne({
        _id: employeeId,
        accountType: 'employee'
    });

    if (!employee) {
        throw new ApiError(404, 'Employee not found or invalid accountType');
    }

    // Check if department exists and belongs to admin's organization
    const department = await departmentModel.findOne({
        _id: departmentId,
        organization: { $in: await OrganizationModel.find({ admin: adminId }).distinct('_id') }
    });

    if (!department) {
        throw new ApiError(404, 'Department not found or access denied');
    }

    // Check if employee is already in the department
    if (employee.employeeData.department?.toString() === departmentId) {
        throw new ApiError(400, 'Employee already belongs to this department');
    }

    // Check if employee's current organization matches the department's organization
    if (employee.employeeData.organization?.toString() !== department.organization.toString()) {
        throw new ApiError(400, 'Employee must belong to the same organization as the department');
    }

    // Update employee's department
    employee.employeeData.department = departmentId;

    // Save changes with error handling
    try {
        await employee.save();
        

        return new ApiResponse(200, {
            message: 'Employee added to department successfully',
            data:null
        }).send(res);
    } catch (error) {
        throw new ApiError(500, 'Failed to update employee department');
    }
});




//get all course of org+deprt of emp
export const getallCourseUnderOrg = asyncHandler(async (req: Request, res: Response) => {
    const empId = req.user?._id;

    if (!empId) {
        throw new ApiError(400, 'Employee ID is required');
    }

    const employee = await userModel.findById(empId);

    if (!employee) {
        throw new ApiError(400, 'Employee not found');
    }

    const orgId = employee.employeeData.organization;
    const deprId = employee.employeeData.department;

    if (!orgId || !deprId) {
        throw new ApiError(400, 'Organization or department not found');
    }

    const allCourse = await courseModel.find({
        linked_entities: {
            $elemMatch: {
                organization: orgId,
                departments: deprId
            }
        }
    }).populate({path:'topics'}).lean();

    if (!allCourse || allCourse.length === 0) {
        throw new ApiError(404, 'No courses found for this organization and department');
    }

    return new ApiResponse(200, {
        message: 'Courses fetched successfully',
        allCourse
    }).send(res);
});








//request to get courses access for employee
export const requestCoursesAccess = asyncHandler(async (req: Request, res: Response) => {
    const { courseId, employeeId } = req.body;

    // Input validation
    if (!courseId || !employeeId) {
        throw new ApiError(400, 'Course ID and Employee ID are required');
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new ApiError(400, 'Invalid Course ID format');
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        throw new ApiError(400, 'Invalid Employee ID format');
    }

    // Check if course exists
    const course = await courseModel.findById({_id:courseId});
    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    if(course.status !== "published"){
        throw new ApiError(400, 'Course is not published');
    }

    // Check if employee exists and is valid
    const employee = await userModel.findOne({
        _id: employeeId,
        accountType: { $in: ['employee', 'individual'] }
    });

    if (!employee) {
        throw new ApiError(404, 'Employee not found');
    }

    // Check if already enrolled
    const isEnrolled = employee.employeeData?.enrolledCourses?.some( (enrolledId) => enrolledId.toString() === courseId );

    if (isEnrolled) {
        throw new ApiError(400, 'Employee is already enrolled in this course');
    }

    // Check if access request already exists
    const existingRequest = await accessRequestModel.findOne({
        employee: employeeId,
        course: courseId
    });

    if (existingRequest) {
        throw new ApiError(400, 'Access request already exists for this course');
    }

    // Create new access request
    const accessRequest = await accessRequestModel.create({
        employee: employeeId,
        course: courseId
    });

    return new ApiResponse(200, {
        message: 'Course access request sent successfully',
        data: accessRequest
    }).send(res);
});






//get all enrolled courses of employee

export const getEmployeeEnrolledCourses = asyncHandler(async (req: Request, res: Response) => {
    const employeeId= req.user?._id;

    // Retrieve the employee
    const employee = await userModel.findOne({ _id: employeeId, accountType: { $in: ['employee', 'individual'] } });

    if (!employee) {
        throw new ApiError(404, 'Employee not found');
    }

    // Get all enrolled courses of the particular employee
    const enrolledCourses: string[] = employee.employeeData?.enrolledCourses || [];

    if (!enrolledCourses || enrolledCourses.length === 0) {
        throw new ApiError(404, 'No courses found');
    }

    // Retrieve course progress for the employee
    const courseProgressRecords = await courseProgressModel.find({ userId: employeeId });

    if (!courseProgressRecords) {
        throw new ApiError(404, 'No course progress found');
    }

    // Prepare course progress mapping
    const courseProgressMap: { [key: string]: any } = {};
    courseProgressRecords.forEach(progress => {
        courseProgressMap[progress.courseId.toString()] = progress;
    });

    // Aggregation pipeline to get course details
    const courseDetailsPipeline = [
        { $match: { _id: { $in: enrolledCourses } } },
        {
            $lookup: {
                from: 'topics',
                localField: '_id',
                foreignField: 'course',
                as: 'topics',
            },
        },
        {
            $lookup: {
                from: 'assessments',
                localField: 'topics._id',
                foreignField: 'subtopic',
                as: 'assessments',
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                duration: 1,
                skills: 1,
                topics: {
                    $map: {
                        input: '$topics',
                        as: 'topic',
                        in: {
                            title: '$$topic.title',
                            subtopics: {
                                $map: {
                                    input: '$$topic.subtopics',
                                    as: 'subtopic',
                                    in: {
                                        title: '$$subtopic.title',
                                        assessments: {
                                            $filter: {
                                                input: '$$subtopic.assessments',
                                                as: 'assessment',
                                                cond: { $eq: ['$$assessment.subtopic', '$$subtopic._id'] }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                progress: {
                    $cond: {
                        if: { $in: ['$_id', enrolledCourses] },
                        then: { $ifNull: [courseProgressMap['$$$_id']?.toString(), null] },
                        else: null
                    }
                }                
            }
        }
    ];

    const coursesData = await courseModel.aggregate(courseDetailsPipeline);

    if (!coursesData || coursesData.length === 0) {
        throw new ApiError(404, 'No courses found');
    }

    return new ApiResponse(200, {
        message: 'All courses retrieved successfully',
        data: coursesData
    }).send(res);
});









//save employee answer
// export const saveEmployeeAnswer = asyncHandler(async (req: Request, res: Response) => {
//     const { courseId, assessmentId, questionId, questionType, isCorrect } = req.body;
//     let answer = req.body.answer;
//     const userId = req.user?._id;
//     let public_id;

//     console.log("Received body:", req.body);
// console.log("User ID:", userId);
// console.log("Answer after processing:", answer);
// console.log("Public ID (if any):", public_id);

  
//     // 1. Handle file uploads for video/audio
//     if (questionType === 'video' || questionType === 'audio') {
//       if (!req.file) {
//         throw new ApiError(400, 'No file uploaded for audio/video question');
//       }
//       // Assume you have a helper function uploadToCloudinary or uploadToS3
//       const uploadedFile = await uploadOnCloudinary(req.file, questionType,);
//     //   await uploadFiles(req.files as any[], validatedData.contentType,validatedData.files,validatedData.videoName);
//       answer = uploadedFile.url; 
//       public_id = uploadedFile.public_id; 
//     }
  
//     // 2. Save the answer in UserAnswerModel
//     const userAnswer = new userAnswerModel({
//         userId,
//         assessmentId,
//         questionId,
//         questionType,
//         answer,
//         public_id,
//         isCorrect
//       });
      
  
//     await userAnswer.save();
  
//     // 3. Update the course progress (same as before)
//     let progress = await courseProgressModel.findOne({ userId, courseId });
  
//     if (!progress) {
//       progress = new courseProgressModel({ userId, courseId });
//     }
  
//     if (!progress.completedQuestions.includes(questionId)) {
//       progress.completedQuestions.push(questionId);
//     }
  
//     const course = await courseModel.findById(courseId);
  
//     const totals = {
//       totalTopics: course?.topics.length,
//       totalSubtopics: course?.topics.reduce((acc, topic) => acc + (topic as any).subtopics?.length, 0),
//       totalAssignments: course?.topics.reduce((acc, topic) => acc + (topic as any).subtopics?.reduce((subAcc: any, subtopic: any) => subAcc + (subtopic as any).assessments.length, 0), 0),
//       totalQuestions: course?.topics.reduce((acc, topic) => acc + (topic as any).subtopics?.reduce((subAcc: any, subtopic: any) => subAcc + (subtopic as any).assessments.length, 0), 0),
//     };
  
    // const weights = {
    //   topicWeight: 0.1,
    //   subtopicWeight: 0.1,
    //   assignmentWeight: 0.1,
    //   questionWeight: 0.7,
    // };
  
    // progress.progressPercent = await CourseSummaryService.calculateWeightedProgress(progress, totals, weights);
    // progress.status = progress.progressPercent === 100 ? 'completed' : 'in progress';
  
//     progress.lastUpdated = new Date();
//     await progress.save();
  
//     return new ApiResponse(200, {
//       message: 'Answer saved and progress updated',
//       userAnswer,
//       progress
//     }).send(res);
//   });


// import userAnswerModel from '../models/userAnswer';
// import courseProgressModel from '../models/courseProgress';
// import courseModel from '../models/course';
// import { Request, Response } from 'express';

  

export const saveUserAnswerAndUpdateProgress = async (req: Request, res: Response) => {
  try {
    const {  assessmentId, questionId, questionType, answer } = req.body;
    const userId = req.user?._id
    // Save or update user answer
    const userAnswer = await userAnswerModel.findOneAndUpdate(
      { userId, assessmentId, questionId },
      { answer, questionType },
      { upsert: true, new: true }
    );

    // Get courseId from assessment (populate course)
    const assessment = await (
      await import('@/models/assessments.model')
    ).default.findById(assessmentId).populate('course');

    if (!assessment || !assessment.course) {
      return res.status(404).json({ success: false, message: 'Assessment or Course not found' });
    }

    const courseId = assessment.course._id;

    // Get or create CourseProgress
    let progress = await courseProgressModel.findOne({ userId, courseId });
    if (!progress) {
      progress = await courseProgressModel.create({ userId, courseId });
    }

    // Update completedQuestions
    if (!progress.completedQuestions.includes(questionId)) {
      progress.completedQuestions.push(questionId);
    }

    
    

//     // Fetch full course structure to recalculate progress
//     const course = await courseModel.findById(courseId)
//     .populate({
//       path: 'topics',
//       populate: {
//         path: 'subtopics',
//         populate: {
//           path: 'assessments',
//           populate: {
//             path: 'questions',
//           }
//         }
//       }
//     })
//     .lean();

    
// const typedCourse = course as ICourse & { 
//     topics: (ITopic & {
//       subtopics: (ISubtopic & {
//         assessments: (Iassessments & {
//           questions: IQuestion[]
//         })[]
//       })[]
//     })[]
//   };
  

//     if (!course) {
//       return res.status(404).json({ success: false, message: 'Course not found' });
//     }

//     // Calculate totals
//     let totalTopics = 0;
//     let totalSubtopics = 0;
//     let totalAssignments = 0;
//     let totalQuestions = 0;

//     for (const topic of typedCourse.topics) {
//         totalTopics++;
//         for (const subtopic of topic.subtopics) {
//           totalSubtopics++;
//           totalAssignments += subtopic.assessments.length;
      
//           for (const assessment of subtopic.assessments) {
//             totalQuestions += assessment.questions?.length || 0;
//           }
//         }
//       }
      
      

//     // Calculate progress percent
//     const totalItems = totalTopics + totalSubtopics + totalAssignments + totalQuestions;
//     const completedItems =
//       (progress.completedTopics?.length || 0) +
//       (progress.completedSubtopics?.length || 0) +
//       (progress.completedAssignments?.length || 0) +
//       (progress.completedQuestions?.length || 0);

//     const progressPercent = totalItems > 0
//       ? Math.round((completedItems / totalItems) * 100)
//       : 0;

//     progress.progressPercent = progressPercent;
//     progress.status = progressPercent === 100 ? 'completed' : 'in progress';
//     progress.lastUpdated = new Date();

//     await progress.save();



const course = await courseModel.findById(courseId)
  .populate({
    path: 'topics',
    populate: {
      path: 'subtopics',
      populate: {
        path: 'assessments',
        populate: {
          path: 'questions',
        },
      },
    },
  });


if (!course) return res.status(404).json({ message: 'Course not found' });

const totals = {
    totalTopics: course.topics.length,
    totalSubtopics: course.topics.reduce(
      (sum, topic: any) => sum + (topic.subtopics?.length || 0),
      0
    ),
    totalAssignments: course.topics.reduce((sum, topic: any) => {
      return sum + topic.subtopics.reduce((subSum: number, sub: any) => {
        return subSum + (sub.assessments?.length || 0);
      }, 0);
    }, 0),
    totalQuestions: course.topics.reduce((sum, topic: any) => {
      return sum + topic.subtopics.reduce((subSum: number, sub: any) => {
        return subSum + sub.assessments.reduce((assSum: number, ass: any) => {
          return assSum + (ass.questions?.length || 0);
        }, 0);
      }, 0);
    }, 0),
  };
  

const weights = {
  topicWeight: 0.1,
  subtopicWeight: 0.1,
  assignmentWeight: 0.1,
  questionWeight: 0.7,
};

progress.progressPercent = await CourseSummaryService.calculateWeightedProgress(
  progress,
  totals,
  weights
);

progress.status = progress.progressPercent === 100 ? 'completed' : 'in progress';
await progress.save();




    return res.status(200).json({
      success: true,
      message: 'Answer saved and progress updated',
      data: {
        userAnswer,
        progress
      }
    });

  } catch (err) {
    console.error('Error in saveUserAnswerAndUpdateProgress:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err
    });
  }
};

  
  
  
  





















// export const requestCoursesAccess = asyncHandler(async (req: Request, res: Response) => {
//     const { courseId, employeeId } = req.body;
  

//     // Input validation
//     if (!courseId) {
//         throw new ApiError(400, 'Course ID is required');
//     }

//     if (!mongoose.Types.ObjectId.isValid(courseId)) {
//         throw new ApiError(400, 'Invalid course ID format');
//     }

//     if (!mongoose.Types.ObjectId.isValid(employeeId)) {
//         throw new ApiError(400, 'Invalid employee ID format');
//     }

//     // Check if course exists
//     const course = await courseModel.findById(courseId);
//     if (!course) {
//         throw new ApiError(404, 'Course not found');
//     }

//     // Check if employee is already enrolled in the course
//     const employee = await userModel.findOne({
//         _id: employeeId,
//         accountType: { $in: ['employee', 'individual'] }
//     });

//     if (!employee) {
//         throw new ApiError(404, 'Employee not found');
//     }

//     // Check if employee is already enrolled in the course
//     const isEnrolled = employee.employeeData?.enrolledCourses?.includes(courseId);

//     if (isEnrolled) {   
//         throw new ApiError(400, 'Employee is already enrolled in this course');
//     }

//     const accessRequest = await accessRequestModel.create({
//         employee: employeeId,
//         course: courseId
//     })

//     if (!accessRequest) {
//         throw new ApiError(404, 'Access request not found');
//     }

//     // Save changes with error handling
//     try {
//         await employee.save();
       
//         return new ApiResponse(200, {
//             message: 'Course access requested sent successfully',
//             data: null
//         }).send(res);
//     } catch (error) {
//         throw new ApiError(500, 'Failed to request course access');
//     }
// });



    

    
    

    
    



























// //------------------------------------------------------->


// import { Request, Response } from 'express';
// import { Employee } from '@/models/employee.model';
// import { Department } from '@/models/department.model';
// import { User } from '@/models/user.model';
// import { generateTokens } from '@/utils/token.utils';
// import { hashPassword } from '@/utils/password.utils';
// import { sendEmail } from '@/utils/email.utils';
// import { generatePassword } from '@/utils/password.utils';




// // Create new employee
// export const createEmployee = async (req: Request, res: Response) => {
//     try {
//         const { email, firstName, lastName, department } = req.body;

//         // Check if department exists
//         const departmentExists = await Department.findById(department);
//         if (!departmentExists) {
//             return res.status(404).json({
//                 status: 404,
//                 message: 'Department not found'
//             });
//         }

//         // Check if employee already exists
//         const existingEmployee = await Employee.findOne({ email });
//         if (existingEmployee) {
//             return res.status(400).json({
//                 status: 400,
//                 message: 'Employee with this email already exists'
//             });
//         }

//         // Generate temporary password
//         const tempPassword = generatePassword();
//         const hashedPassword = await hashPassword(tempPassword);

//         // Create user account
//         const user = await User.create({
//             email,
//             password: hashedPassword,
//             firstName,
//             lastName,
//             accountType: 'employee'
//         });

//         // Create employee record
//         const employee = await Employee.create({
//             user: user._id,
//             department: department,
//             status: 'active'
//         });

//         // Send welcome email with temporary password
//         await sendEmail({
//             to: email,
//             subject: 'Welcome to SkillSparc',
//             text: `Welcome ${firstName}! Your temporary password is: ${tempPassword}. Please change it after your first login.`
//         });

//         res.status(201).json({
//             status: 201,
//             message: 'Employee created successfully',
//             data: {
//                 employee: {
//                     id: employee._id,
//                     email,
//                     firstName,
//                     lastName,
//                     department: departmentExists.name
//                 }
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 500,
//             message: 'Error creating employee',
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// };






// // Get all employees
// export const getEmployees = async (req: Request, res: Response) => {
//     try {
//         const employees = await Employee.find()
//             .populate('user', 'email firstName lastName')
//             .populate('department', 'name');

//         res.status(200).json({
//             status: 200,
//             message: 'Employees retrieved successfully',
//             data: employees
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 500,
//             message: 'Error retrieving employees',
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// };





// // Get employee by ID
// export const getEmployeeById = async (req: Request, res: Response) => {
//     try {
//         const { id } = req.params;
//         const employee = await Employee.findById(id)
//             .populate('user', 'email firstName lastName')
//             .populate('department', 'name');

//         if (!employee) {
//             return res.status(404).json({
//                 status: 404,
//                 message: 'Employee not found'
//             });
//         }

//         res.status(200).json({
//             status: 200,
//             message: 'Employee retrieved successfully',
//             data: employee
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 500,
//             message: 'Error retrieving employee',
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// };






// // Update employee
// export const updateEmployee = async (req: Request, res: Response) => {
//     try {
//         const { id } = req.params;
//         const { firstName, lastName, department } = req.body;

//         // Check if department exists
//         if (department) {
//             const departmentExists = await Department.findById(department);
//             if (!departmentExists) {
//                 return res.status(404).json({
//                     status: 404,
//                     message: 'Department not found'
//                 });
//             }
//         }

//         const employee = await Employee.findById(id);
//         if (!employee) {
//             return res.status(404).json({
//                 status: 404,
//                 message: 'Employee not found'
//             });
//         }

//         // Update user details
//         await User.findByIdAndUpdate(employee.user, {
//             firstName,
//             lastName
//         });

//         // Update employee details
//         const updatedEmployee = await Employee.findByIdAndUpdate(
//             id,
//             { department },
//             { new: true }
//         ).populate('user', 'email firstName lastName')
//          .populate('department', 'name');

//         res.status(200).json({
//             status: 200,
//             message: 'Employee updated successfully',
//             data: updatedEmployee
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 500,
//             message: 'Error updating employee',
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// };







// // Delete employee
// export const deleteEmployee = async (req: Request, res: Response) => {
//     try {
//         const { id } = req.params;
//         const employee = await Employee.findById(id);

//         if (!employee) {
//             return res.status(404).json({
//                 status: 404,
//                 message: 'Employee not found'
//             });
//         }

//         // Delete user account
//         await User.findByIdAndDelete(employee.user);

//         // Delete employee record
//         await Employee.findByIdAndDelete(id);

//         res.status(200).json({
//             status: 200,
//             message: 'Employee deleted successfully'
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 500,
//             message: 'Error deleting employee',
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// }; 