import { Types, Schema } from 'mongoose';
import UserModel from '@/models/user.model';
import OrganizationModel from '@/models/organization.model';
import DepartmentModel from '@/models/department.model';
import CourseModel from '@/models/course.model';
import ApiError from './apiError.utils';
import courseModel from '@/models/course.model';
import { IUser } from '@/types/user.types';

interface AdminLimitCheck {
    isAllowed: boolean;
    message: string;
    limit: number;
    currentCount: number;
}

interface AdminLimits {
    maxOrganizations: number;
    maxDepartments: number;
    maxCourses: number;
    maxEmployees: number;
    maxEmployeesPerOrg: Array<{
        orgID: Schema.Types.ObjectId;
        limit: number;
    }>;
    // maxEmployeesPerDept: number;
    maxEmployeesPerCourse: number; //need to recheck
}

class AdminLimitsUtils {

    //check if admin can create a new organization
    static async canCreateOrganization(adminId: Types.ObjectId): Promise<AdminLimitCheck> {
        const admin = await UserModel.findById(adminId);
        if (!admin) {
            throw new ApiError(404, 'Admin not found');
        }

        const currentOrgCount = await OrganizationModel.countDocuments({ admin: adminId });
        const limit = admin.adminLimits?.maxOrganizations || 0;

        return {
            isAllowed: currentOrgCount < limit,
            message: currentOrgCount >= limit 
                ? `Organization limit reached (${currentOrgCount}/${limit})` 
                : '',
            limit: limit,
            currentCount: currentOrgCount

        };
    }




    //check if admin can create a new course
    static async canCreateCourse(adminId: Types.ObjectId): Promise<AdminLimitCheck> {
        const admin = await UserModel.findById(adminId);
        if (!admin) {
            throw new ApiError(404, 'Admin not found');
        }

        const currentCourseCount = await CourseModel.countDocuments({ createdByAdmin: adminId , status: 'published'});
        console.log("currentCourseCount--->", currentCourseCount)
        const limit = admin.adminLimits?.maxCourses || 0;
        console.log("limit--->", limit)

        return {
            isAllowed: currentCourseCount < limit,
            message: currentCourseCount >= limit
                ? `Course limit reached (${currentCourseCount}/${limit})` 
                : '',
            limit: limit,
            currentCount: currentCourseCount
        };
    }





    //check if admin can create a new department--> total department by admin
    static async canCreateDepartment(adminId: Types.ObjectId): Promise<AdminLimitCheck> {
        const admin = await UserModel.findById(adminId);
        if (!admin) {
            throw new ApiError(404, 'Admin not found');
        }

        const currentDeptCount = await DepartmentModel.countDocuments({ 
            organization: { $in: admin.created_orgs } 
        });
        const limit = admin.adminLimits?.maxDepartments || 0;

        return {
            isAllowed: currentDeptCount < limit,
            message: currentDeptCount >= limit 
                ? `Department limit reached (${currentDeptCount}/${limit})` 
                : '',
            limit: limit,
            currentCount: currentDeptCount
        };
    }




    //Check if admin can add more employees--> total employees by admin in all organizations
    static async canAddEmployee(adminId: Types.ObjectId): Promise<AdminLimitCheck> {
        console.log("entering canAddEmployee")
        try {
            if (!adminId) {
                throw new ApiError(400, 'Admin ID is required');
            }

            const admin = await UserModel.findById(adminId);
            if (!admin) {
                throw new ApiError(404, 'Admin not found');
            }

            console.log("admin", admin)

            const limit = admin.adminLimits?.maxEmployees || 0;
            if (limit < 0) {
                throw new ApiError(400, 'Invalid employee limit');
            }

            console.log("limit", limit)

            const currentEmployeeCount = await UserModel.countDocuments({
                'employeeData.organization': { $in: admin.created_orgs },
                'accountStatus': 'active'
            });

            console.log("currentEmployeeCount", currentEmployeeCount)

            return {
                isAllowed: currentEmployeeCount < limit,
                message: currentEmployeeCount >= limit 
                    ? `Total Employee limit reached (${currentEmployeeCount}/${limit})` 
                    : '',
                limit: limit,
                currentCount: currentEmployeeCount
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Error checking employee limit');
        }
    }



    //Check if an organization can have more employees--> total employees by admin in a single organization
    static async canAddEmployeeToOrg(orgId: Types.ObjectId): Promise<AdminLimitCheck> { 
        //sinup req approve krta time use hoga
        console.log("entering canAddEmployeeToOrg")
        try {
            if (!orgId) {
                throw new ApiError(400, 'Organization ID is required');
            }

            console.log("orgId", orgId)

            const org = await OrganizationModel.findById(orgId);
            if (!org) {
                throw new ApiError(404, 'Organization not found');
            }

            console.log("org", org)

            const admin = await UserModel.findById(org.admin);
            if (!admin) {
                throw new ApiError(404, 'Admin not found');
            }

            console.log("admin", admin)

            const limit = admin.adminLimits?.maxEmployeesPerOrg?.find((org:any) => org.orgID.equals(orgId))?.limit || 0;
            if (limit < 0) {
                throw new ApiError(400, 'Invalid organization employee limit');
            }

            console.log("limit", limit)

            const currentOrgEmployeeCount = await UserModel.countDocuments({
                'employeeData.organization': orgId,
                'accountStatus': 'active'
            });

            console.log("currentOrgEmployeeCount", currentOrgEmployeeCount)

            return {
                isAllowed: currentOrgEmployeeCount < limit,
                message: currentOrgEmployeeCount >= limit 
                    ? `Organization employee limit reached (${currentOrgEmployeeCount}/${limit}) for org ${org.name}` 
                    : '',
                limit: limit,
                currentCount: currentOrgEmployeeCount
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Error checking organization employee limit');
        }
    }




    // //Check if a department can have more employees
    // static async canAddEmployeeToDept(deptId: Types.ObjectId): Promise<AdminLimitCheck> {
    //     const dept = await DepartmentModel.findById(deptId);
    //     if (!dept) {
    //         throw new ApiError(404, 'Department not found');
    //     }

    //     const org = await OrganizationModel.findById(dept.organization);
    //     if (!org) {
    //         throw new ApiError(404, 'Organization not found');
    //     }

    //     const admin = await UserModel.findById(org.admin);
    //     if (!admin) {
    //         throw new ApiError(404, 'Admin not found');
    //     }

    //     //count krega vo saare user jinki dept iss given dept h
    //     const currentDeptEmployeeCount = await UserModel.countDocuments({
    //         'employeeData.department': deptId
    //     });
    //     const limit = admin.adminLimits?.maxEmployeesPerDept || 0;

    //     return {
    //         isAllowed: currentDeptEmployeeCount < limit,
    //         message: currentDeptEmployeeCount >= limit 
    //             ? `Department employee limit reached (${currentDeptEmployeeCount}/${limit})` 
    //             : '',
    //         limit: limit,
    //         currentCount: currentDeptEmployeeCount
    //     };
    // }




    //Check if a course can have more enrolled users--> total enrolled users by admin in a single course
    static async canAddEmployeeToCourse(adminId: Types.ObjectId, courseId: Types.ObjectId): Promise<AdminLimitCheck> {
        const admin = await UserModel.findById(adminId);
        if (!admin) throw new ApiError(404, 'Admin not found');
      
        // Find limit for the specific course--> admin ke limit update krna hoga
        const courseLimitObj = admin.adminLimits?.maxEmployeesPerCourse?.find((c:any) => c.courseID == courseId);
        const limit = courseLimitObj?.limit ?? (admin.adminLimits?.maxEmployeesPerCourseDefault || 0)

        console.log("admin limit for maxEmployeesPerCourse -->",limit)
      
        const currentCourseEmployeeCount = await UserModel.countDocuments({
          'employeeData.enrolledCourses': courseId,
          accountStatus: 'active'
        });
      
        console.log("currentCourseEmployeeCount -->",currentCourseEmployeeCount)
        return {
          isAllowed: currentCourseEmployeeCount < limit,
          message: currentCourseEmployeeCount >= limit 
            ? `Course employee limit reached (${currentCourseEmployeeCount}/${limit})` 
            : '',
          limit,
          currentCount: currentCourseEmployeeCount
        };
      }
      




    //Update admin limits
    // static async updateAdminLimits(
    //     adminId: Types.ObjectId, 
    //     newLimits: Partial<AdminLimits>
    // ): Promise<IUser> {
    //     const admin = await UserModel.findById(adminId);
    //     if (!admin) {
    //         throw new ApiError(404, 'Admin not found');
    //     }

    //     // Get current usage
    //     const currentCounts = await this.getAdminLimitsAndUsage(adminId);
        
    //     // Validate numeric limits
    //     for (const [key, value] of Object.entries(newLimits)) {
    //         if (key === 'maxEmployeesPerOrg') {
    //             // Handle maxEmployeesPerOrg array separately
    //             const orgLimits = value as unknown as Array<{ orgID: Types.ObjectId; limit: number }>;
    //             for (const orgLimit of orgLimits) {
    //                 const currentOrgCount = await UserModel.countDocuments({
    //                     'employeeData.organization': orgLimit.orgID
    //                 });
    //                 if (orgLimit.limit < currentOrgCount) {
    //                     throw new ApiError(400, 
    //                         `Cannot set organization ${orgLimit.orgID} limit to ${orgLimit.limit} as current usage is ${currentOrgCount}`);
    //                 }
    //             }
    //         } else {
    //             // Handle other numeric limits
    //             const currentCount = currentCounts.AdminUsage[key as keyof AdminLimits];
    //             if (typeof value === 'number' && value < 0) {
    //                 throw new ApiError(400, 
    //                     `Cannot set ${key} to ${value} as it is invalid`);
    //             }
    //             if (typeof value === 'number' && value < currentCount) {
    //                 throw new ApiError(400, 
    //                     `Cannot set ${key} to ${value} as current usage is ${currentCount}`);
    //             }
    //         }
    //     }

    //     // Update admin limits
    //     const updatedAdmin = await UserModel.findByIdAndUpdate(
    //         adminId,
    //         { $set: { 'adminLimits': { ...admin.adminLimits, ...newLimits } } },
    //         { new: true }
    //     ).select('-password').lean().exec();

    //     if (!updatedAdmin) {
    //         throw new ApiError(500, 'Failed to update admin limits');
    //     }

    //     return updatedAdmin as IUser;
    // }




   




    static async getAdminLimitsAndUsage(adminId: Types.ObjectId): Promise<{
        AdminLimits: AdminLimits,
        AdminUsage: {
          maxOrganizations: number;
          maxDepartments: number;
          maxCourses: number;
          maxEmployees: number;
          maxEmployeesPerOrg: Array<{
            orgID: Types.ObjectId;
            limit: number;
            currentCount: number;
            orgName: string;
          }>;
          maxEmployeesPerCourse: Array<{
            courseID: Types.ObjectId;
            limit: number;
            currentCount: number;
            courseName: string;
          }>;
        }
      }> {
        const admin = await UserModel.findById(adminId);
        if (!admin || admin.accountType !== 'admin') {
          throw new ApiError(404, 'Admin not found or unauthorized');
        }
      
        // Get all organizations created by this admin
        const orgs = await OrganizationModel.find({ admin: adminId });
        const orgIds = orgs.map(org => org._id);
      
        // Get all departments under these organizations
        const departments = await DepartmentModel.find({ organization: { $in: orgIds } });
        const deptIds = departments.map(dept => dept._id);
      
        // Get all courses created by this admin
        const courses = await CourseModel.find({ createdByAdmin: adminId, status: 'published' });
        const courseIds = courses.map(course => course._id);

        // Get employee counts for each organization
        const orgEmployeeCounts = await Promise.all(
          orgs.map(async (org) => {
            const count = await UserModel.countDocuments({
              'employeeData.organization': org._id,
              accountStatus: 'active'
            });
            return {
              orgID: org._id,
              orgName: org.name,
              currentCount: count
            };
          })
        );

        // Get max employees in any course
        const maxEmployeesInCourse = await CourseModel.aggregate([
          { $match: { _id: { $in: courseIds } } },
          { $project: { 
              _id: 1,
              title: 1,
              enrolledEmployeesCount: { $size: "$enrolledEmployees" }
            }
          },
          { $sort: { enrolledEmployeesCount: -1 } },
          { $limit: 1 }
        ]);

        // Get total employee count
        const totalEmployeeCount = await UserModel.countDocuments({
          'employeeData.organization': { $in: orgIds },
          accountStatus: 'active'
        });
      
        return {
          AdminLimits: admin.adminLimits as unknown as AdminLimits,
          AdminUsage: {
            maxOrganizations: orgIds.length,
            maxDepartments: deptIds.length,
            maxCourses: courseIds.length,
            maxEmployees: totalEmployeeCount,
            maxEmployeesPerOrg: orgEmployeeCounts.map(org => ({
              orgID: org.orgID as unknown as Types.ObjectId,
              limit: admin.adminLimits?.maxEmployeesPerOrg?.find(
                (limit:any) => limit.orgID.equals(org.orgID)
              )?.limit || 0,
              currentCount: org.currentCount,
              orgName: org.orgName
            })),
            maxEmployeesPerCourse: maxEmployeesInCourse[0]?.enrolledEmployeesCount || []
          }
        };
      }
      
      



    
     
     
     
    //   Get admin limits and usage in a format suitable for frontend --> need to recheck
    
//     static async getAdminLimitsAndUsageForFrontend(adminId: Types.ObjectId): Promise<{
//         user: {
//             _id: Types.ObjectId;
//             name: string;
//             accountType: string;
//             adminLimits: AdminLimits;
//             adminUsage: Record<string, number>;
//         }
//     }> {
//         const admin = await UserModel.findById(adminId).select('name accountType adminLimits');
//         if (!admin || admin.accountType !== 'admin') {
//             throw new ApiError(404, 'Admin not found or unauthorized');
//         }

//         // Get all organizations created by admin
//         const orgs = await OrganizationModel.find({ admin: adminId });
//         const orgIds = orgs.map(org => org._id);
        
//         // Get all departments in these organizations
//         const depts = await DepartmentModel.find({ organization: { $in: orgIds } });
//         const deptIds = depts.map(dept => dept._id);
        
//         // Get all courses created by admin
//         const courses = await CourseModel.find({ createdByAdmin: adminId });
//         const courseIds = courses.map(course => course._id);

//         const [
//             orgCount,
//             courseCount,
//             deptCount,
//             employeeCount,
//             maxEmployeesInOrg,
//             maxEmployeesInDept,
//             maxEmployeesInCourse
//         ] = await Promise.all([
//             OrganizationModel.countDocuments({ admin: adminId }),
//             CourseModel.countDocuments({ createdByAdmin: adminId }),
//             DepartmentModel.countDocuments({ organization: { $in: orgIds } }),
//             UserModel.countDocuments({ 'employeeData.organization': { $in: orgIds } }),
//             // Get max employees in any single organization
//             UserModel.aggregate([
//                 { $match: { 'employeeData.organization': { $in: orgIds } } },
//                 { $group: { _id: '$employeeData.organization', count: { $sum: 1 } } },
//                 { $sort: { count: -1 } },
//                 { $limit: 1 }
//             ]).then(result => result[0]?.count || 0),
//             // Get max employees in any single department
//             UserModel.aggregate([
//                 { $match: { 'employeeData.department': { $in: deptIds } } },
//                 { $group: { _id: '$employeeData.department', count: { $sum: 1 } } },
//                 { $sort: { count: -1 } },
//                 { $limit: 1 }
//             ]).then(result => result[0]?.count || 0),
//             // Get max employees in any single course
//             UserModel.aggregate([
//                 { $match: { 'employeeData.enrolledCourses': { $in: courseIds } } },
//                 { $group: { _id: '$employeeData.enrolledCourses', count: { $sum: 1 } } },
//                 { $sort: { count: -1 } },
//                 { $limit: 1 }
//             ]).then(result => result[0]?.count || 0)
//         ]);

//         return {
//             user: {
//                 _id: admin._id as unknown as Types.ObjectId,
//                 name: admin.name,
//                 accountType: admin.accountType,
//                 adminLimits: admin.adminLimits || {
//                     maxOrganizations: 0,
//                     maxCourses: 0,
//                     maxDepartments: 0,
//                     maxEmployees: 0,
//                     maxEmployeesPerOrg: [] as Array<{ orgID: Types.ObjectId; limit: number }>,
//                     maxEmployeesPerCourse: 0
//                 } as AdminLimits,
//                 adminUsage: {
//                     organizations: orgCount,
//                     courses: courseCount,
//                     departments: deptCount,
//                     employees: employeeCount,
//                     employeesPerOrg: maxEmployeesInOrg,
//                     employeesPerDept: maxEmployeesInDept,
//                     employeesPerCourse: maxEmployeesInCourse
//                 }
//             }
//         };
//     }



}

export default AdminLimitsUtils; 