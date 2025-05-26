import { Request, Response } from 'express';
import ApiError from "@/utils/apiError.utils";
import asyncHandler from "@/utils/asyncHandler.utils";
import ApiResponse from "@/utils/apiResponse.utils";
import OrganizationModel from '@/models/organization.model';
import CourseModel from '@/models/course.model';
import AccessRequestModel from '@/models/accessRequest.model';
import mongoose, { ClientSession, Schema, Types } from 'mongoose';
import userModel from '@/models/user.model';
import AdminLimitsUtils from '@/utils/adminLimits.utils';






//---------------------------------->access request controller<--------------------------------


//get single course access request
export const getSingleCourseAccessRequestbyorganization = asyncHandler(async (req: Request, res: Response) => {
    const { courseId, organizationId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new ApiError(400, 'Invalid course ID');
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw new ApiError(400, 'Invalid organization ID');
    }

    const course = await CourseModel.findOne({_id: courseId, 'linked_entities.organization': organizationId});

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    const accessRequests = await AccessRequestModel.find({course: course._id})
    .populate({
        path: 'employee',
        match: { 'employeeData.organization': organizationId },
        select: 'name email  accountType jobTitle employeeData.department',
        populate: {
            path: 'personalInfo',
            select: 'avatar_url'
        }
    })
    .populate({
        path: 'course',
        select: 'title'
    })
    .populate({
        path: 'reviewedBy',
        select: 'name email'
    })
    .sort({ requestedAt: -1 }).lean();

    const filteredRequests = accessRequests.filter(req => req.employee !== null);

    return new ApiResponse(200, { filteredRequests }, 'Course access requests retrieved successfully').send(res);
});





//bulk handle Course Access Request controller
export const handleCourseAccessRequest = asyncHandler(async (req: Request, res: Response) => {
    const { requestIds, action } = req.body;
    const adminId = req.user?._id;

    if (!adminId) throw new ApiError(401, 'Unauthorized access');

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
        throw new ApiError(400, 'requestIds must be a non-empty array');
    }

    const validActions = ['approve', 'reject'];
    if (!validActions.includes(action)) {
        throw new ApiError(400, 'Invalid action. Must be approve or reject');
    }

    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();

    try {
        const allowedOrgs = await OrganizationModel
            .find({ admin: adminId })
            .distinct('_id')
            .session(session);

        const results: any[] = [];

        for (const requestId of requestIds) {
            if (!mongoose.Types.ObjectId.isValid(requestId)) {
                results.push({ requestId, status: 'failed', reason: 'Invalid ID' });
                continue;
            }

            const accessRequest = await AccessRequestModel
                .findById(requestId)
                .populate('course')
                .session(session);

            if (!accessRequest) {
                results.push({ requestId, status: 'failed', reason: 'Access request not found' });
                continue;
            }

            const course = await CourseModel.findOne({
                _id: accessRequest.course,
                'linked_entities.organization': { $in: allowedOrgs }
            }).session(session);

            if (!course) {
                results.push({ requestId, status: 'failed', reason: 'No access to this course' });
                continue;
            }

            const employeeId = accessRequest.employee;
            const employee = await userModel.findById(employeeId).session(session);

            
            if (action === 'approve') { //means phela se req pending hai toh approve kro

                if (accessRequest.status !== 'pending') { //ensure karo phela se req pending hai
                    results.push({ requestId, status: 'skipped', reason: 'Already processed' });
                    continue;
                }

                //check admin limits
                const adminLimits = await AdminLimitsUtils.canAddEmployeeToCourse(adminId as unknown as Types.ObjectId, course._id as unknown as Types.ObjectId);
                if (!adminLimits.isAllowed) {
                    // throw new ApiError(400, adminLimits.message);
                    results.push({ 
                        requestId, 
                        status: 'skipped', 
                        reason: adminLimits.message
                    });
                    continue;
                }

                // Add employee to course
                if (course.enrolledEmployees && !course.enrolledEmployees.includes(employeeId)) {
                    course.enrolledEmployees.push(employeeId);
                    await course.save({ session });
                }

                // Add course to employee
                if (employee?.employeeData?.enrolledCourses && !employee.employeeData.enrolledCourses.includes(course._id)) {
                    employee.employeeData.enrolledCourses.push(course._id);
                    await employee.save({ session });
                }

                accessRequest.status = 'approved';

            } else if (action === 'reject') {

                // Case 1: Request is already rejected -- means phela se req rejected hai --> just change status to rejected at last
                if (accessRequest.status === 'rejected') {
                    results.push({ requestId, status: 'skipped', reason: 'Already rejected' });
                    continue;
                }

                // Case 2: app rej krna chahta ho--> current req approved hai-> remove course & emp ->change status
                if (accessRequest.status === 'approved') {
                    if (course.enrolledEmployees) {
                        course.enrolledEmployees = course.enrolledEmployees.filter(emp =>
                            emp.toString() !== employeeId.toString()
                        );
                        await course.save({ session });
                    }

                    if (employee?.employeeData?.enrolledCourses) {
                        employee.employeeData.enrolledCourses = employee.employeeData.enrolledCourses.filter(cid =>
                            cid.toString() !== course._id.toString()
                        );
                        await employee.save({ session });
                    }
                }

                // Case 3: For both pending & approved -->set to rejected
                accessRequest.status = 'rejected';
            }

            accessRequest.reviewedBy = adminId;
            accessRequest.reviewedAt = new Date();
            await accessRequest.save({ session });

            results.push({ requestId, status: 'success', newStatus: accessRequest.status });
        }

        await session.commitTransaction();
        session.endSession();

        return new ApiResponse(200, { results }, `Bulk access requests processed for action: ${action}`).send(res);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(500, 'Bulk operation failed', error as any[]);
    }
});




export const updateSingleAccessRequest = asyncHandler(async (req: Request, res: Response) => {
    const { action, courseId, employeeId } = req.body;
    const adminId = req.user?._id;

    // 1. Auth check
    if (!adminId) throw new ApiError(401, 'Unauthorized access');

    // 2. Validate IDs
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
        throw new ApiError(400, 'Invalid course or employee ID');
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // 3. Get list of orgs this admin controls
        const allowedOrgs = await OrganizationModel.find({ admin: adminId }).distinct('_id');

        // 4. Verify course access
        const course = await CourseModel.findOne({
            _id: courseId,
            'linked_entities.organization': { $in: allowedOrgs }
        }).session(session);

        if (!course) throw new ApiError(403, 'Access denied to this course');

        // 5. Get access request and user
        const accessRequest = await AccessRequestModel.findOne({
            course: courseId,
            employee: employeeId
        }).session(session);

        if (!accessRequest) throw new ApiError(404, 'Access request not found');

        const user = await userModel.findById(employeeId).session(session);
        if (!user) throw new ApiError(404, 'User not found');

    

        if (action === 'approve') {

            //check admin limits
            const adminLimits = await AdminLimitsUtils.canAddEmployeeToCourse(adminId as unknown as Types.ObjectId, courseId as unknown as Types.ObjectId);
            if (!adminLimits.isAllowed) {
                throw new ApiError(400, adminLimits.message);
            }

            console.log("adminLimits-->",adminLimits)

            //'pending' or 'rejected' -->approve
            if (course.enrolledEmployees && !course.enrolledEmployees.includes(employeeId)) {
                course.enrolledEmployees.push(employeeId);
            }

            if (user.employeeData.enrolledCourses && !user.employeeData.enrolledCourses.includes(courseId)) {
                user.employeeData.enrolledCourses.push(courseId);
            }

            accessRequest.status = 'approved';
            console.log("exiting approve--->")
        }

        else if (action === 'reject') {
            //'pending' or 'approved' -->reject
            if (course.enrolledEmployees) {
                course.enrolledEmployees = course.enrolledEmployees.filter(e =>
                    e.toString() !== employeeId.toString()
                );
            }

            if (user.employeeData.enrolledCourses) {
                user.employeeData.enrolledCourses = user.employeeData.enrolledCourses.filter(c =>
                    c.toString() !== courseId.toString()
                );
            }

            accessRequest.status = 'rejected';
        }

        else {
            throw new ApiError(400, 'Invalid action');
        }

        // 7. Record admin who reviewed
        accessRequest.reviewedBy = adminId;
        accessRequest.reviewedAt = new Date();

        // 8. Save all documents
        await Promise.all([
            course.save({ session }),
            user.save({ session }),
            accessRequest.save({ session }),
        ]);

       

        await session.commitTransaction();

        return new ApiResponse(200, { accessRequest }, `Access ${accessRequest.status} successfully`).send(res);

    } catch (error) {
        await session.abortTransaction();
        console.log('error in aceess req-->',error)
        throw new ApiError(500, 'Internal server error');
    } finally {
        session.endSession();
    }
});





















// export const handleCourseAccessRequest = asyncHandler(async (req: Request, res: Response) => {
//     const { requestIds, action } = req.body;
//     const adminId = req.user?._id;

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     if (!Array.isArray(requestIds) || requestIds.length === 0) {
//         throw new ApiError(400, 'requestIds must be a non-empty array');
//     }

//     const validActions = ['approve', 'reject', 'revoke'];
//     if (!validActions.includes(action)) {
//         throw new ApiError(400, 'Invalid action. Must be approve, reject, or revoke');
//     }

//     const session: ClientSession = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const allowedOrgs = await OrganizationModel
//             .find({ admin: adminId })
//             .distinct('_id')
//             .session(session);

//         const results: any[] = [];

//         for (const requestId of requestIds) {
//             if (!mongoose.Types.ObjectId.isValid(requestId)) {
//                 results.push({ requestId, status: 'failed', reason: 'Invalid ID' });
//                 continue;
//             }

//             const accessRequest = await AccessRequestModel
//                 .findById(requestId)
//                 .populate('course')
//                 .session(session);

//             if (!accessRequest) {
//                 results.push({ requestId, status: 'failed', reason: 'Access request not found' });
//                 continue;
//             }

//             const course = await CourseModel.findOne({
//                 _id: accessRequest.course,
//                 'linked_entities.organization': { $in: allowedOrgs }
//             }).session(session);

//             if (!course) {
//                 results.push({ requestId, status: 'failed', reason: 'No access to this course' });
//                 continue;
//             }

//             const employeeId = accessRequest.employee;
//             const employee = await userModel.findById(employeeId).session(session);

//             // Perform action
//             if (action === 'approve') {

//                 if (accessRequest.status !== 'pending') {
//                     results.push({ requestId, status: 'skipped', reason: 'Already processed' });
//                     continue;
//                 }

//                 if (course.enrolledEmployees && !course.enrolledEmployees.includes(employeeId)) {
//                     course.enrolledEmployees.push(employeeId);
//                     await course.save({ session });
//                 }

//                 if (employee?.employeeData?.enrolledCourses && !employee.employeeData.enrolledCourses.includes(course._id)) {
//                     employee.employeeData.enrolledCourses.push(course._id);
//                     await employee.save({ session });
//                 }

//                 accessRequest.status = 'approved';

//             } 
//             else if (action === 'reject') {

//                 if (accessRequest.status !== 'pending') {
//                     results.push({ requestId, status: 'skipped', reason: 'Already processed' });
//                     continue;
//                 }

//                 accessRequest.status = 'rejected';

//             } else if (action === 'revoke') {
//                 if (accessRequest.status !== 'approved') {
//                     results.push({ requestId, status: 'skipped', reason: 'Not approved yet' });
//                     continue;
//                 }

//                 if (course.enrolledEmployees) {
//                     course.enrolledEmployees = course.enrolledEmployees.filter(emp =>
//                         emp.toString() !== employeeId.toString()
//                     );
//                     await course.save({ session });
//                 }

//                 if (employee?.employeeData?.enrolledCourses) {
//                     employee.employeeData.enrolledCourses = employee.employeeData.enrolledCourses.filter(cid =>
//                         cid.toString() !== course._id.toString()
//                     );
//                     await employee.save({ session });
//                 }

//                 accessRequest.status = 'revoked';
//             }

//             accessRequest.reviewedBy = adminId;
//             accessRequest.reviewedAt = new Date();
//             await accessRequest.save({ session });

//             results.push({ requestId, status: 'success', newStatus: accessRequest.status });
//         }

//         await session.commitTransaction();
//         session.endSession();

//         return new ApiResponse(200, { results }, `Bulk access requests processed for action: ${action}`).send(res);

//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         throw new ApiError(500, 'Bulk operation failed', error as any[]);
//     }
// });










//update single access request











// // Approve access request
// export const approveAccessRequest = asyncHandler(async (req: Request, res: Response) => {
//     const { requestId} = req.body;
//     const adminId = req.user?._id;

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     if (!mongoose.Types.ObjectId.isValid(requestId)) {
//         throw new ApiError(400, 'Invalid request ID');
//     }

//     // Find the access request
//     const accessRequest = await AccessRequestModel.findById(requestId)
//         .populate('course')
//         .populate('employee');

//     if (!accessRequest) {
//         throw new ApiError(404, 'Access request not found');
//     }

//     // Verify admin has access to the course's organization
//     const allowedOrgs = await OrganizationModel.find({ admin: adminId }).distinct('_id');
//     const course = await CourseModel.findOne({
//         _id: accessRequest.course,
//         'linked_entities.organization': { $in: allowedOrgs }
//     });

//     if (!course) {
//         throw new ApiError(403, 'Access denied to this course');
//     }

//     // Update access request accountaccountaccountStatus
//     accessRequest.status = 'approved';
//     accessRequest.reviewedBy = adminId;
//     accessRequest.reviewedAt = new Date();
//     await accessRequest.save();

//     // Add employee to course's enrolled employees
//     course.enrolledEmployees?.push(accessRequest.employee);
//     await course.save();

//     return new ApiResponse(200, { accessRequest }, 'Access request approved successfully').send(res);
// });






// // Reject/revoke access request
// export const rejectOrRevokeAccessRequest = asyncHandler(async (req: Request, res: Response) => {
//     const { requestId } = req.body;
//     const adminId = req.user?._id;

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     if (!mongoose.Types.ObjectId.isValid(requestId)) {
//         throw new ApiError(400, 'Invalid request ID');
//     }

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         // Fetch access request with course populated
//         const accessRequest = await AccessRequestModel.findById(requestId)
//             .populate('course')
//             .populate('employee')
//             .session(session);

//         if (!accessRequest) {
//             throw new ApiError(404, 'Access request not found');
//         }

//         if(accessRequest.status === 'revoked'){
//             throw new ApiError(400, 'Access request already revoked');
//         }

//         // Ensure admin has access to the course's organization
//         const allowedOrgs = await OrganizationModel.find({ admin: adminId }).distinct('_id');
//         const course = await CourseModel.findOne({
//             _id: accessRequest.course,
//             'linked_entities.organization': { $in: allowedOrgs }
//         }).session(session);

//         if (!course) {
//             throw new ApiError(403, 'Access denied to this course');
//         }

//         const employeeId = accessRequest.employee;

//         if (accessRequest.status === 'approved') {
//             // Revoke logic
//             course.enrolledEmployees = course.enrolledEmployees?.filter(emp => emp.toString() !== employeeId.toString());
//             await course.save({ session });

//             const user = await userModel.findById(employeeId).session(session);
//             if (user?.employeeData?.enrolledCourses?.length) {
//                 user.employeeData.enrolledCourses = user.employeeData.enrolledCourses.filter(courseId =>
//                     courseId.toString() !== course._id.toString()
//                 );
//                 await user.save({ session });
//             }

//             accessRequest.status = 'revoked';

//         } else if (accessRequest.status === 'pending') {
//             // Reject logic
//             accessRequest.status = 'rejected';

//         } else {
//             throw new ApiError(400, `Cannot reject or revoke a request with current status '${accessRequest.status}'`);
//         }

//         accessRequest.reviewedBy = adminId;
//         accessRequest.reviewedAt = new Date();
//         await accessRequest.save({ session });

//         await session.commitTransaction();
//         session.endSession();

//         return new ApiResponse(
//             200,
//             { accessRequest },
//             `Access request ${accessRequest.status} successfully`
//         ).send(res);

//     } catch (err) {
//         await session.abortTransaction();
//         session.endSession();
//         throw err;
//     }
// });







