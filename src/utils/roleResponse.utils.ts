import { IUser } from '@/types/user.types';
import UserModel from '@/models/user.model';
import OrganizationModel from '@/models/organization.model';
import DepartmentModel from '@/models/department.model';
import CourseModel from '@/models/course.model';
import { IOrganization, IDepartment, ICourse } from '@/types/index';

export const getaccountTypeSpecificResponse = async (user: IUser) => {
    if (user.accountType === 'superadmin') {
        return await getSuperAdminResponse(user);
    } else if (user.accountType === 'admin') {
        return await getAdminResponse(user);
    } 
    else if (user.accountType === 'individual') {
        return await getIndividualResponse(user);
    }
    else {
        return await getEmployeeResponse(user);
    }
};

const getSuperAdminResponse = async (user: IUser) => {
    const admins = await UserModel.find({
        accountType: 'admin',
        createdBySuperAdmin: user._id
    }).select('_id name email accountType profile created_orgs adminLimits accountStatus');

    return {
        _id:user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        adminCount: admins.length,
        adminsCreatedBySuperAdmin: admins,
        accountStatus: user.accountStatus
    };
};

const getAdminResponse = async (user: IUser) => {

    // const organizations = await OrganizationModel.aggregate([
    //     { $match: { admin: user._id } },
    //     {
    //         $lookup: {
    //             from: 'departments',
    //             localField: '_id',
    //             foreignField: 'organization',
    //             as: 'departments'
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: 'courses',
    //             localField: '_id',
    //             foreignField: 'organization',
    //             as: 'courses'
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: 'users',
    //             localField: '_id',
    //             foreignField: 'employeeData.organization',
    //             as: 'employees'
    //         }
    //     },
    //     {
    //         $project: {
    //             _id: 1,
    //             name: 1,
    //             description: 1,
    //             numberOfEmployees: { $size: '$employees' },
    //             numberOfDepartments: { $size: '$departments' },
    //             numberOfCourses: { $size: '$courses' }
    //         }
    //     }
    // ]);

    // Get creator information if admin was created by superadmin
    

    const organizations = await OrganizationModel.aggregate([
        { $match: { admin: user._id } },
        {
            $lookup: {
                from: 'departments',
                localField: '_id',
                foreignField: 'organization',
                as: 'departments'
            }
        },
        {
            $lookup: {
                from: 'courses',
                localField: '_id',
                foreignField: 'organization',
                as: 'courses'
            }
        },
        {
            $lookup: {
                from: 'users',
                let: { orgId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$employeeData.organization', '$$orgId'] },
                                    { $eq: ['$accountStatus', 'active'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'employees'
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                numberOfEmployees: { $size: '$employees' },
                numberOfDepartments: { $size: '$departments' },
                numberOfCourses: { $size: '$courses' },
                departments: 1
            }
        }
    ]);
    
    
    
    let creatorInfo = null;
    if (user.createdBySuperAdmin) {
        const creator = await UserModel.findById(user.createdBySuperAdmin)
            .select('_id name email');
        if (creator) {
            creatorInfo = {
                _id: creator._id,
                name: creator.name,
                email: creator.email
            };
        }
    }

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        adminLimits: user.adminLimits,
        created_orgs: organizations,
        createdBy: creatorInfo
    };
};




const getEmployeeResponse = async (user: IUser) => {
    const [organizationDoc, departmentDoc, enrolledCourseDocs] = await Promise.all([
        OrganizationModel.findById(user.employeeData?.organization).select('name').lean(),
        DepartmentModel.findById(user.employeeData?.department).select('name').lean(),
        CourseModel.find({
            _id: { $in: user.employeeData?.enrolledCourses || [] }
        }).select('title description duration image_url status').lean()
    ]);

    const organization = organizationDoc as IOrganization | null;
    const department = departmentDoc as IDepartment | null;
    const enrolledCourses = enrolledCourseDocs as ICourse[];

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        jobTitle: user.jobTitle,
        employeeData: {
            organization: organization ? {
                _id: organization._id.toString(),
                name: organization.name
            } : null,
            department: department ? {
                _id: department._id.toString(),
                name: department.name
            } : null,
            enrolledCourses: enrolledCourses.map(course => ({
                _id: course._id.toString(),
                title: course.title,
                description: course.description,
                duration: course.duration,
                image_url: course.image_url,
                status: course.status
            }))
        }
    };
}; 



const getIndividualResponse = async (user: IUser) => {
    const individual = await UserModel.findById(user._id)
    .populate('personalInfo');

    if (!individual) {
        throw new Error('User not found');
    }

    return {
        _id: individual._id,
        name: individual.name,
        email: individual.email,
        accountType: individual.accountType,
        status: individual.accountStatus,
        personalInfo: individual.personalInfo
    };
};
