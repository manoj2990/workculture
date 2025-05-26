

import { Request, Response } from 'express';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiError from '@/utils/apiError.utils';
import ApiResponse from '@/utils/apiResponse.utils';
import UserModel from '@/models/user.model';
import OrganizationModel from '@/models/organization.model';
import AdminLimitsUtils from '@/utils/adminLimits.utils';
import mongoose, { Types } from 'mongoose';




// Enhanced organization stats pipeline
const getOrganizationStatsPipeline = (adminId: string) => [
    { $match: { admin: adminId } },
    {
        $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: 'organization',
            as: 'departments',
            pipeline: [
                {
                    $lookup: {
                        from: 'courses',
                        localField: '_id',
                        foreignField: 'linked_entities.departments',
                        as: 'courses'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        description: 1,
                        courses: {
                            $map: {
                                input: '$courses',
                                as: 'course',
                                in: {
                                    _id: '$$course._id',
                                    title: '$$course.title',
                                    description: '$$course.description',
                                    status: '$$course.status',
                                    enrolledEmployees: { $size: '$$course.enrolledEmployees' }
                                }
                            }
                        }
                    }
                }
            ]
        }
    },
    {
        $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: 'linked_entities.organization',
            as: 'courses'
        }
    },
    {
        $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'employeeData.organization',
            as: 'employees',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        profile: 1,
                        employeeData: 1
                    }
                }
            ]
        }
    },
    {
        $project: {
            _id: 1,
            name: 1,
            admin_email: 1,
            logo_url: 1,
            departments: 1,
            courses: {
                $map: {
                    input: '$courses',
                    as: 'course',
                    in: {
                        _id: '$$course._id',
                        title: '$$course.title',
                        description: '$$course.description',
                        duration: '$$course.duration',
                        status: '$$course.status',
                        enrolledEmployees: { $size: '$$course.enrolledEmployees' }
                    }
                }
            },
            employees: 1,
            stats: {
                totalDepartments: { $size: '$departments' },
                totalCourses: { $size: '$courses' },
                totalEmployees: { $size: '$employees' }
            },
            createdAt: 1,
            updatedAt: 1
        }
    }
];


//GET MY DETAILS
export const getMyDetails = asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(400, 'Admin ID is required');
    }

    try {
        const [admin, organizations] = await Promise.all([
            UserModel.findById(adminId).select('-password -__v'),
            OrganizationModel.aggregate(getOrganizationStatsPipeline(adminId.toString()))
        ]);

        if (!admin) {
            throw new ApiError(404, 'Admin not found');
        }

        // Calculate overall statistics
        const overallStats = {
            totalOrganizations: organizations.length,
            totalDepartments: organizations.reduce((acc, org) => acc + org.stats.totalDepartments, 0),
            totalCourses: organizations.reduce((acc, org) => acc + org.stats.totalCourses, 0),
            totalEmployees: organizations.reduce((acc, org) => acc + org.stats.totalEmployees, 0)
        };

        return new ApiResponse(200, {
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                accountType: admin.accountType,
                // profile: admin.profile,
                adminLimits: admin.adminLimits,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt
            },
            organizations,
            overallStats
        }, 'Admin details fetched successfully').send(res);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Failed to fetch admin details');
    }
});




//get admin limits and usage
export const getAdminLimitsAndUsage = asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user?._id;

    if (!adminId){
        throw new ApiError(400, 'Admin ID is required');
    }

    try {
        const adminLimits = await AdminLimitsUtils.getAdminLimitsAndUsage(adminId as unknown as Types.ObjectId);
        return new ApiResponse(200, adminLimits).send(res);
    } catch (error) {
        throw new ApiError(500, 'Failed to fetch admin limits and usage');
    }
});









