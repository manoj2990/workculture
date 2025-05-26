import { Request, Response } from 'express';
import ApiError from "@/utils/apiError.utils";
import asyncHandler from "@/utils/asyncHandler.utils";
import ApiResponse from "@/utils/apiResponse.utils";
import RegistrationRequestModel from '@/models/registrationRequest';
import userModel from '@/models/user.model';
import mongoose, { ClientSession, Types } from 'mongoose';

import AdminLimitsUtils from '@/utils/adminLimits.utils';








//get all registration req from user for specific organization
export const getallRegistrationRequests = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const adminId = req.user?._id;
    const orgId = req.body.orgId;
console.log("entering getallRegistrationRequests")
    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!orgId) {
        throw new ApiError(400, 'Organization ID is required');
    }

    //check admin is exist or not
    const admin = await userModel.findById(adminId);
    if (!admin) {
        throw new ApiError(401, 'Admin not found');
    }

    try {
       


        console.log("fetching registration requests")
    
        const registrationRequests = await RegistrationRequestModel.aggregate([
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
              }
            },
            { $unwind: '$userDetails' },
            {
              $match: {
                'userDetails.employeeData.organization': new mongoose.Types.ObjectId(orgId)
              }
            },
            {
              $lookup: {
                from: 'organizations',
                localField: 'userDetails.employeeData.organization',
                foreignField: '_id',
                as: 'organizationDetails'
              }
            },
            { $unwind: { path: '$organizationDetails', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'departments',
                localField: 'userDetails.employeeData.department',
                foreignField: '_id',
                as: 'departmentDetails'
              }
            },
            { $unwind: { path: '$departmentDetails', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'personalinfos',
                localField: 'userDetails.personalInfo',
                foreignField: '_id',
                as: 'personalInfo'
              }
            },
            { $unwind: { path: '$personalInfo', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                status: 1,
                requestedAt: 1,
                userName: '$userDetails.name',
                userEmail: '$userDetails.email',
                accountType: '$userDetails.accountType',
                jobTitle: '$userDetails.jobTitle',
                accountStatus: '$userDetails.accountStatus',
                departmentName: '$departmentDetails.name',
                departmentDescription: '$departmentDetails.description',
                organizationName: '$organizationDetails.name',
                organizationLogo: '$organizationDetails.logo_url',
                organizationAdminEmail: '$organizationDetails.organization_admin_email',
                user_image: '$personalInfo.avatar_url'
              }
            },
            { $sort: { requestedAt: -1 } },
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) }
          ]);
          

          console.log("registrationRequests", registrationRequests)




        return new ApiResponse(200, { registrationRequests}, 'Registration requests fetched successfully').send(res);

    }
    catch (error) {
        throw new ApiError(500, 'Internal server error', error as any[]);
    }

});





//handle bulk registration req--> ye registration deshboar se handle hoga
export const handleRegistrationRequest = asyncHandler(async (req: Request, res: Response) => {
    console.log("entering handleRegistrationRequest")
    const { requestIds, action } = req.body;
    const adminId = req.user?._id;
    console.log("adminId", adminId)
    console.log("requestIds", requestIds)
    console.log("action", action)

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

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
        const results: any[] = [];

        for (const requestId of requestIds) {
            if (!mongoose.Types.ObjectId.isValid(requestId)) {
                results.push({ requestId, status: 'failed', reason: 'Invalid ID' });
                continue;
            }

            const regRequest = await RegistrationRequestModel
                .findById(requestId)
                .populate('user')
                .session(session);

            if (!regRequest) {
                results.push({ requestId, status: 'failed', reason: 'Registration request not found' });
                continue;
            }

            const user = regRequest.user as any;
            const currentStatus = regRequest.status;
            const newStatus = action === 'approve' ? 'approved' : 'rejected';

            // Validate state transition
            const validTransitions: Record<string, string[]> = {
                'pending': ['approved', 'rejected'],
                'approved': ['rejected'],
                'rejected': ['approved']
            };

            if (!validTransitions[currentStatus]?.includes(newStatus)) {
                results.push({ 
                    requestId, 
                    status: 'skipped', 
                    reason: `Invalid state transition from ${currentStatus} to ${newStatus}` 
                });
                continue;
            }

            // Update registration request
            regRequest.status = newStatus;
            regRequest.reviewedBy = adminId as unknown as mongoose.Types.ObjectId;
            regRequest.reviewedAt = new Date();

            // Update user status based on action and current state
            if (action === 'approve') {

                //check admin limits --> total emp limit check
                const adminLimits = await AdminLimitsUtils.canAddEmployee(adminId as unknown as Types.ObjectId);
                if (!adminLimits.isAllowed) {
                    // throw new ApiError(400, adminLimits.message);
                    results.push({ 
                        requestId, 
                        status: 'skipped', 
                        reason: adminLimits.message
                    });
                    continue;
                }

                //check admin limits --> org emp limit check
                const orgLimits = await AdminLimitsUtils.canAddEmployeeToOrg(user.employeeData.organization as unknown as Types.ObjectId);
                if (!orgLimits.isAllowed) {
                    // throw new ApiError(400, orgLimits.message);
                    results.push({ 
                        requestId, 
                        status: 'skipped', 
                        reason: orgLimits.message
                    });
                    continue;
                }

                // //check admin limits --> dept emp limit check
                // const deptLimits = await AdminLimitsUtils.canAddEmployeeToDept(user.employeeData.department as unknown as Types.ObjectId);
                // if (!deptLimits.isAllowed) {
                //     throw new ApiError(400, deptLimits.message);
                // }


                // Only activate if not already active
                if (user && user.accountStatus !== 'active') {
                    user.accountStatus = 'active';
                    await user.save({ session });
                }
            } else if (action === 'reject') {
                // Only deactivate if previously approved
                if (user && currentStatus === 'approved' && user.accountStatus === 'active') {
                    user.accountStatus = 'inactive';
                    await user.save({ session });
                }
            }

            await regRequest.save({ session });

            results.push({ 
                requestId, 
                status: 'success', 
                newStatus: regRequest.status,
                userStatus: user?.accountStatus
            });
        }

        await session.commitTransaction();
        session.endSession();

        return new ApiResponse(200, { 
            results,
            summary: {
                total: requestIds.length,
                success: results.filter(r => r.status === 'success').length,
                failed: results.filter(r => r.status === 'failed').length,
                skipped: results.filter(r => r.status === 'skipped').length
            }
        }, `Bulk registration requests processed for action: ${action}`).send(res);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(500, 'Bulk registration operation failed', error as any[]);
    }
});








//update single registration req --> ye single registration req update karegi
export const updateSingleRegistrationRequest = asyncHandler(async (req: Request, res: Response) => {
    const { userId, action } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!['approve', 'reject'].includes(action)) {
        throw new ApiError(400, 'Invalid action. Must be either "approve" or "reject"');
    }

    const user = await userModel.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const regRequest = await RegistrationRequestModel.findOne({ user: userId });
    if (!regRequest) {
        throw new ApiError(404, 'Registration request not found');
    }

    if (action === 'approve') {

        //check admin limits --> total emp limit check
        const adminLimits = await AdminLimitsUtils.canAddEmployee(adminId as unknown as Types.ObjectId);
        if (!adminLimits.isAllowed) {
            throw new ApiError(400, adminLimits.message);
        }

        //check admin limits --> org emp limit check
        const orgLimits = await AdminLimitsUtils.canAddEmployeeToOrg(user.employeeData.organization as unknown as Types.ObjectId);
        if (!orgLimits.isAllowed) {
            throw new ApiError(400, orgLimits.message);
        }


        //check admin limits --> dept emp limit check
        // const deptLimits = await AdminLimitsUtils.canAddEmployeeToDept(user.employeeData.department as unknown as Types.ObjectId);
        // if (!deptLimits.isAllowed) {
        //     throw new ApiError(400, deptLimits.message);
        // }
        
        
    
        regRequest.status = 'approved';
        if (user.accountStatus === 'inactive') {
            user.accountStatus = 'active';
            await user.save();
        }
    } else if (action === 'reject') {
        regRequest.status = 'rejected';
        if (user.accountStatus === 'active') {
            user.accountStatus = 'inactive';
            await user.save();
        }
    }

    regRequest.reviewedBy = adminId as unknown as mongoose.Types.ObjectId;
    regRequest.reviewedAt = new Date();
    await regRequest.save();

    return new ApiResponse(
        200,
        { regRequest },
        `Registration request has been ${action === 'approve' ? 'approved' : 'rejected'} successfully`
    ).send(res);
});












