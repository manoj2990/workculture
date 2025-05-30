import { Request, Response } from 'express';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiError from '@/utils/apiError.utils';
import ApiResponse from '@/utils/apiResponse.utils';
import OrganizationModel from '@/models/organization.model';
import UserModel from '@/models/user.model';
import CourseModel from '@/models/course.model';
import mongoose, { Types } from 'mongoose';

import { IDepartment, ICourse, IUser, IPersonalInfo } from '@/types/getOrganization.type';
import AdminLimitsUtils from '@/utils/adminLimits.utils';
import CourseSummaryService from '@/services/CourseSummary.service';

interface MemberStatus {
    userId: string;
    name: string;
    completed: number;
    inProgress: number;
  }
  
  interface MemberStatusMap {
    [key: string]: MemberStatus;
  }

// Create Organization
export const createOrganization = asyncHandler(async (req: Request, res: Response) => {
console.log("creating org------>")
    const { name, organization_admin_email, logo_url, departments,adminId } = req.body;
    const validatedData={name, organization_admin_email, logo_url, departments}
    // const adminId = req.user?._id;

    if(!validatedData.name || !validatedData.organization_admin_email){
        throw new ApiError(400, 'Name and organization admin email are required');
    }

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    const existingOrg = await OrganizationModel.findOne({ name: validatedData.name });
    if (existingOrg) {
        throw new ApiError(400, 'Organization with this name already exists');
    }


    //check admin limits
    const adminLimits = await AdminLimitsUtils.canCreateOrganization(adminId as unknown as Types.ObjectId);
    if (!adminLimits.isAllowed) {
        throw new ApiError(400, adminLimits.message || 'Organization creation limit reached');
    }


    //>>>>>>>>trasaction for creating organization and updating admin user
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const organization = await OrganizationModel.create([{ //create organization
            ...validatedData,
            admin: adminId
        }], { session });

        if (!organization || organization.length === 0) {
            throw new ApiError(500, 'Failed to create organization');
        }


        const created_orgs = organization[0];//it returns array of created organizations[{},{}..]

        await UserModel.findByIdAndUpdate(adminId, { //update admin user with created organization id
           $push: { created_orgs: created_orgs._id }
        }, { session });

        await session.commitTransaction();
        await session.endSession();

    //>>>>>>>>>>>>>>>> end of transaction


        return new ApiResponse(201, created_orgs).send(res);
    } catch (error) {
        await session.abortTransaction();
        throw error;
    }

});





// Get All Organizations with Statistics
export const getAllOrganizations = asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    const organizations = await OrganizationModel.find({ admin: adminId })
        .select('name organization_admin_email logo_url departments')
        .populate({
            path: 'departments',
            select: 'name courses'
        });

    if (!organizations || organizations.length === 0) {
        throw new ApiError(404, 'No organizations found');
    }

    // Get statistics for each organization
    const organizationsWithStats = await Promise.all(
        organizations.map(async (org) => {
            const [courses, employees] = await Promise.all([
                CourseModel.find({ 'linked_entities.organization': org._id }),
                UserModel.find({ 'employeeData.organization': org._id, accountType: 'employee' })
            ]);

            return {
                _id: org._id,
                name: org.name,
                organization_admin_email:org.organization_admin_email,
                logo_url: org.logo_url,
                departments: org.departments,
                statistics: {
                    totalDepartments: org.departments.length,
                    totalCourses: courses.length,
                    totalEmployees: employees.length
                }
            };
        })
    );

    return new ApiResponse(200, {
        organizations: organizationsWithStats
    }, 'Organizations fetched successfully').send(res);
});





// Get Organization by ID ---> need to review this
//1. all departments --> name description,total courses,total employees
//2. all courses --> name ,total employees enrolled,total
//3. all employees --> name email avatar , also need to add cousr complete/progress
// export const getOrganizationById = asyncHandler(async (req: Request, res: Response) => {
//     const {organizationId }= req.body;
//     const adminId = req.user?._id;

//     console.log("organizationId -->",organizationId)

//     if(!organizationId){
//         throw new ApiError(400, 'Organization ID is required');
//     }

//     if(!mongoose.Types.ObjectId.isValid(organizationId)){
//         throw new ApiError(400, 'Invalid organization ID');
//     }

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     const organization = await OrganizationModel.findOne({
//         _id: organizationId,
//         admin: adminId
//     }).populate<{ departments: IDepartment[] }>({
//         path: 'departments',
//         select: 'name description courses',
//         populate: {
//             path: 'courses',
//             select: 'title'
//         }
//     });

//     if (!organization) {
//         throw new ApiError(404, 'Organization not found or access denied');
//     }

//     console.log("organization-->", organization)

//     // Get all courses for the organization with enrolled employees count
//     const courses = await CourseModel.find<ICourse>({ 'linked_entities.organization': organization._id ,
//          status:'published'})
//         .select('title enrolledEmployees linked_entities')
//         .populate({
//             path: 'enrolledEmployees',
//             select: '_id'
//         });

//         console.log("course --->",courses)

//     // Get all employees with their basic info and populated personalInfo
//     const employees = await UserModel.find<IUser>({ 
//         'employeeData.organization': organization._id, 
//         accountType: 'employee' 
//     })
//     .select('name email personalInfo jobTitle accountType employeeData.department skills')
//     .populate<{ personalInfo: IPersonalInfo }>({
//         path: 'personalInfo',
//         select: 'avatar_url'
//     });

//     // Get course progress for all employees in the organization
//     const memberStatusList = await CourseSummaryService.getOrganizationMembersCourseStatus(organizationId);
//     const memberStatusMap: MemberStatusMap = {};
//     memberStatusList.forEach((member: MemberStatus) => {
//         memberStatusMap[member.userId] = member;
//     });

//     // Process departments to include statistics
//     const departmentsWithStats = organization.departments.map(dept => {
//         const departmentCourses = courses.filter(course => 
//             course.linked_entities.some(data => 
//                 data.departments.some(depId => depId.toString() === dept._id.toString())
//             )
//         );


//         // console.log("departmentsWithStats --->",departmentsWithStats)


        
//         const departmentEmployees = employees.filter(emp => 
//             emp.employeeData?.department?.toString() === dept._id.toString()
//         );

//         return {
//             _id: dept._id,
//             name: dept.name,
//             description: dept.description,
//             statistics: {
//                 totalCourses: departmentCourses.length,
//                 totalEmployees: departmentEmployees.length
//             }
//         };
//     });

//     // Process courses to include enrolled count
//     const coursesWithStats = courses.map(course => ({
//         _id: course._id,
//         title: course.title,
//         totalEnrolled: course.enrolledEmployees?.length || 0
//     }));

//     const organizationWithStats = {
//         _id: organization._id,
//         name: organization.name,
//         organization_admin_email: organization.organization_admin_email,
//         logo_url: organization.logo_url,
//         departments: departmentsWithStats,
//         courses: coursesWithStats,
//         employees: employees.map(emp => {
//             const personalInfo = emp.personalInfo as IPersonalInfo;
//             return {
//                 _id: emp._id,
//                 name: emp.name,
//                 email: emp.email,
//                 avatar: personalInfo?.avatar_url || null,
//                 jobTitle: emp.jobTitle,
//                 accountType: emp.accountType,
//                 department: emp.employeeData?.department || null,
//                 skills: emp.skills || [],
//                 courseStats: memberStatusMap[emp._id.toString()] || {
//                     completed: 0,
//                     inProgress: 0,
//                     percentage: 0
//                 }
//             };
//         }),
//         statistics: {
//             totalDepartments: departmentsWithStats.length,
//             totalCourses: coursesWithStats.length,
//             totalEmployees: employees.length
//         }
//     };

//     return new ApiResponse(200, organizationWithStats).send(res);
// });
export const getOrganizationById = asyncHandler(async (req: Request, res: Response) => {
    const { organizationId } = req.body;
    const adminId = req.user?._id;

    console.log("organizationId -->", organizationId);

    if (!organizationId) {
        throw new ApiError(400, 'Organization ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw new ApiError(400, 'Invalid organization ID');
    }

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    const organization = await OrganizationModel.findOne({
        _id: organizationId,
        admin: adminId
    }).populate<{ departments: IDepartment[] }>({
        path: 'departments',
        select: 'name description courses',
        populate: {
            path: 'courses',
            select: 'title'
        }
    });

    if (!organization) {
        throw new ApiError(404, 'Organization not found or access denied');
    }

    console.log("organization-->", organization);

    // Get all published courses for the organization
    const courses = await CourseModel.find<ICourse>({
        'linked_entities.organization': organization._id,
        status: 'published'
    })
        .select('title enrolledEmployees linked_entities')
        .populate({
            path: 'enrolledEmployees',
            select: '_id'
        });

    console.log("course --->", courses);

    // Get all employees with personalInfo and department populated
    const employees = await UserModel.find<IUser>({
        'employeeData.organization': organization._id,
        accountType: 'employee'
    })
        .select('name email personalInfo jobTitle accountType employeeData.department skills')
        .populate<{ personalInfo: IPersonalInfo; employeeData: { department: IDepartment, skills:IUser } }>([
            {
                path: 'personalInfo',
                select: 'avatar_url'
            },
            {
                path: 'employeeData.department',
                select: 'name'
            },
            {
                path:'employeeData.skills',
                select: 'skills'
            }
        ]);

    // Get course progress for all employees
    const memberStatusList = await CourseSummaryService.getOrganizationMembersCourseStatus(organizationId);
    const memberStatusMap: MemberStatusMap = {};
    memberStatusList.forEach((member: MemberStatus) => {
        memberStatusMap[member.userId] = member;
    });

    // Process departments to include statistics
    const departmentsWithStats = organization.departments.map(dept => {
        const departmentCourses = courses.filter(course =>
            course.linked_entities.some(data =>
                data.departments.some(depId => depId.toString() === dept._id.toString())
            )
        );

        const departmentEmployees = employees.filter(emp =>
            emp.employeeData?.department?._id?.toString() === dept._id.toString()
        );

        return {
            _id: dept._id,
            name: dept.name,
            description: dept.description,
            statistics: {
                totalCourses: departmentCourses.length,
                totalEmployees: departmentEmployees.length
            }
        };
    });

    // Process courses to include enrolled count
    const coursesWithStats = courses.map(course => ({
        _id: course._id,
        title: course.title,
        totalEnrolled: course.enrolledEmployees?.length || 0
    }));

    const organizationWithStats = {
        _id: organization._id,
        name: organization.name,
        organization_admin_email: organization.organization_admin_email,
        logo_url: organization.logo_url,
        departments: departmentsWithStats,
        courses: coursesWithStats,
        employees: employees.map(emp => {
            const personalInfo = emp.personalInfo as IPersonalInfo;
            const department = emp.employeeData?.department
                ? {
                    _id: emp.employeeData.department._id,
                    name: emp.employeeData.department.name
                }
                : null;
            const skills = emp.employeeData?.skills 

            return {
                _id: emp._id,
                name: emp.name,
                email: emp.email,
                avatar: personalInfo?.avatar_url || null,
                jobTitle: emp.jobTitle,
                accountType: emp.accountType,
                department, // populated department name here
                // skills: emp.skills || [],
                skills,
                courseStats: memberStatusMap[emp._id.toString()] || {
                    completed: 0,
                    inProgress: 0,
                    percentage: 0
                }
            };
        }),
        statistics: {
            totalDepartments: departmentsWithStats.length,
            totalCourses: coursesWithStats.length,
            totalEmployees: employees.length
        }
    };

    return new ApiResponse(200, organizationWithStats).send(res);
});







// Update Organization --> need to resp
// export const updateOrganization = asyncHandler(async (req: Request, res: Response) => {
//     const { id : organizationId, name, logo_url, organization_admin_email } = req.body;
//     const adminId = req.user?._id;

//     if(!mongoose.Types.ObjectId.isValid(organizationId)){
//         throw new ApiError(400, 'Invalid organization ID');
//     }

//     if(!organizationId){
//         throw new ApiError(400, 'Organization ID is required');
//     }

//     if(!name || !organization_admin_email){
//         throw new ApiError(400, 'Name and organization admin email are required');
//     }

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     // Only allow updating these specific fields
//     const updateData = {
//         name,
//         logo_url,
//         organization_admin_email
//     };

//     const organization = await OrganizationModel.findOneAndUpdate(
//         { 
//             _id: organizationId,
//             admin: adminId
//         },
//         updateData,
//         { new: true }
//     ).populate<{ departments: IDepartment[] }>({
//         path: 'departments',
//         select: 'name description courses',
//         populate: {
//             path: 'courses',
//             select: 'title'
//         }
//     });

//     if (!organization) {
//         throw new ApiError(404, 'Organization not found or access denied');
//     }

//     // Get all courses for the organization with enrolled employees count
//     const courses = await CourseModel.find<ICourse>({ 'linked_entities.organization': organization._id })
//         .select('title enrolledEmployees')
//         .populate({
//             path: 'enrolledEmployees',
//             select: '_id'
//         });

//     // Get all employees with their basic info and populated personalInfo
//     const employees = await UserModel.find<IUser>({ 
//         'employeeData.organization': organization._id, 
//         accountType: 'employee' 
//     })
//     .select('name email personalInfo')
//     .populate<{ personalInfo: IPersonalInfo }>({
//         path: 'personalInfo',
//         select: 'avatar_url'
//     });

//     // Process departments to include statistics
//     const departmentsWithStats = organization.departments.map(dept => {
//         const departmentCourses = courses.filter(course => 
//             course.linked_entities.some(data => 
//                 data.departments.some(depId => depId.toString() === dept._id.toString())
//             )
//         );
        
//         const departmentEmployees = employees.filter(emp => 
//             emp.employeeData?.department?.toString() === dept._id.toString()
//         );

//         return {
//             _id: dept._id,
//             name: dept.name,
//             description: dept.description,
//             statistics: {
//                 totalCourses: departmentCourses.length,
//                 totalEmployees: departmentEmployees.length
//             }
//         };
//     });

//     // Process courses to include enrolled count
//     const coursesWithStats = courses.map(course => ({
//         _id: course._id,
//         title: course.title,
//         totalEnrolled: course.enrolledEmployees?.length || 0
//     }));

//     const organizationWithStats = {
//         _id: organization._id,
//         name: organization.name,
//         organization_admin_email: organization.organization_admin_email,
//         logo_url: organization.logo_url,
//         departments: departmentsWithStats,
//         courses: coursesWithStats,
//         employees: employees.map(emp => {
//             const personalInfo = emp.personalInfo as IPersonalInfo;
//             return {
//                 _id: emp._id,
//                 name: emp.name,
//                 email: emp.email,
//                 avatar: personalInfo?.avatar_url || null
//             };
//         }),
//         statistics: {
//             totalDepartments: departmentsWithStats.length,
//             totalCourses: coursesWithStats.length,
//             totalEmployees: employees.length
//         }
//     };

//     return new ApiResponse(200, organizationWithStats, 'Organization updated successfully').send(res);
// });




export const updateOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { id: organizationId, name, logo_url, organization_admin_email } = req.body;
    const adminId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw new ApiError(400, 'Invalid organization ID');
    }

    if (!organizationId) {
        throw new ApiError(400, 'Organization ID is required');
    }

    if (!name || !organization_admin_email) {
        throw new ApiError(400, 'Name and organization admin email are required');
    }

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    const updated = await OrganizationModel.findOneAndUpdate(
        { _id: organizationId, admin: adminId },
        { name, logo_url, organization_admin_email },
        { new: true }
    );

    if (!updated) {
        throw new ApiError(404, 'Organization not found or access denied');
    }

    return new ApiResponse(200, null, 'Organization updated successfully').send(res);
});










// Delete Organization ---> need to review this
//1. remove organization from all courses
//2. remove organization from all employees
//3. remove organization from all departments
//4. delete organization
export const deleteOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { id : organizationId } = req.body;
    const adminId = req.user?._id;

    if(!mongoose.Types.ObjectId.isValid(organizationId)){
        throw new ApiError(400, 'Invalid organization ID');
    }

    if(!organizationId){
        throw new ApiError(400, 'Organization ID is required');
    }

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    const organization = await OrganizationModel.findOneAndDelete({
        _id: organizationId,
        admin: adminId
    });

    if (!organization) {
        throw new ApiError(404, 'Organization not found or access denied');
    }

    // Clean up related data
    await Promise.all([
        CourseModel.deleteMany({ 'linked_entities.organization': organizationId }),
        UserModel.updateMany(
            { 'employeeData.organization': organizationId },
            { $unset: { 'employeeData.organization': 1 } }
        )
    ]);

    return new ApiResponse(200, { message: 'Organization deleted successfully' }).send(res);
});
