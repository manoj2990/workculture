import { Request, Response } from 'express';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiError from '@/utils/apiError.utils';
import ApiResponse from '@/utils/apiResponse.utils';
import DepartmentModel from '@/models/department.model';
import OrganizationModel from '@/models/organization.model';
import UserModel from '@/models/user.model';
import CourseModel from '@/models/course.model';
import { PopulatedDepartment, IPopulatedCourse, IPersonalInfo } from '@/types';
import mongoose, { Types } from 'mongoose';
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

//add course to department
export const addCourseToDepartment = asyncHandler(async (req: Request, res: Response) => {
   
    const { courseId,departmentId } = req.body;

    const adminId = req.user?._id;

    if(!courseId || !departmentId){
        throw new ApiError(400, 'Course ID and Department ID are required');
    }

    if(!adminId){
        throw new ApiError(401, 'Unauthorized access');
    }

    const department = await DepartmentModel.findById(departmentId);

    if(!department){
        throw new ApiError(404, 'Department not found');
    }

    const course = await CourseModel.findById(courseId);

    if(!course){
        throw new ApiError(404, 'Course not found');
    }


    department.courses.push(courseId);

    await department.save();


    return new ApiResponse(200, 'Course added to department successfully').send(res);
    
    
});




// Create Department
export const createDepartment = asyncHandler(async (req: Request, res: Response) => {

    // const { Id: organizationId } = req.params;
    const { name, description,organizationId } = req.body;
    const adminId = req.user?._id;

    console.log("organizationId--->", organizationId)
    console.log("adminId--->", adminId)

    if(!organizationId){
        throw new ApiError(400, 'Organization ID is required');
    }
    
    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }


    if(!name || !description ){
        throw new ApiError(400, 'Department name, description are required');
    }
    
   
    
    // Check if organization exists and belongs to admin -->able to create department
    const organization = await OrganizationModel.findOne({
        _id: organizationId,
        admin: adminId
    });

    if (!organization) {
        throw new ApiError(404, 'Organization not found');
    }

    // Check if department with same name exists in the organization
    const existingDept = await DepartmentModel.findOne({
        organization: organizationId,
        name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingDept) {
        throw new ApiError(400, 'Department with this name already exists in the organization');
    }


    //check admin limits
    const adminLimits = await AdminLimitsUtils.canCreateDepartment(adminId as unknown as Types.ObjectId);
    if (!adminLimits.isAllowed) {
        throw new ApiError(400, adminLimits.message );
    }


    //>>>>>>>>transaction logic
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const createdDepartment = await DepartmentModel.create(
            [{ name, description, organization: organizationId }],
            { session }
          );
          
          if (!createdDepartment) {
              throw new ApiError(500, 'Failed to create department');
          }
          const departmentDoc = createdDepartment[0];
          

          const organizationDetails : any = await OrganizationModel.findByIdAndUpdate(
            organizationId,
            { $push: { departments: departmentDoc._id } },
            { new: true, session }
          );

          if (!organizationDetails) {
              throw new ApiError(500, 'Failed to update organization');
          }

        await session.commitTransaction();
        await session.endSession();


       const newDepartment : any = {
            department: {
                _id: departmentDoc._id,
                name: departmentDoc.name,
                description: departmentDoc.description,
                courses: [],
                employees: [],
                organization: organizationDetails._id,
                admin: organizationDetails.admin
            }

        }

        console.log("newDepartment", newDepartment);

        return new ApiResponse(201, newDepartment).send(res);
        
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }


});



// Get specific department details by id--> only published courses details
export const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
    const { departmentId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) throw new ApiError(401, 'Unauthorized access');
    if (!departmentId) throw new ApiError(400, 'Department ID is required');

    const department = await DepartmentModel.findById(departmentId)
        .populate<PopulatedDepartment>({
            path: 'courses',
            select: 'title description duration skills image_url status enrolledEmployees'
        });

    if (!department) throw new ApiError(404, 'Department not found');

    const organization = await OrganizationModel.findOne({
        _id: department.organization,
        admin: adminId
    });

    if (!organization) throw new ApiError(403, 'Access denied to this department');

    const employees = await UserModel.find({
        'employeeData.department': departmentId,
        accountType: 'employee'
    }).populate('personalInfo employeeData.skills');

    if (!employees) throw new ApiError(404, 'No employees found');

    const courses = department.courses as IPopulatedCourse[];
    const totalEnrollments = courses.reduce((sum, course) =>
        sum + (course.enrolledEmployees?.length || 0), 0
    );

    // Get department-level course status summary
    const departmentCourseStatus = await CourseSummaryService.getDepartmentCourseStatus(departmentId);

    // Get per-employee course status summary
    const memberStatusList = await CourseSummaryService.getDepartmentMembersCourseStatus(departmentId);
    const memberStatusMap: MemberStatusMap = {};
    memberStatusList.forEach((member: MemberStatus) => {
        memberStatusMap[member.userId] = member;
    });

    //add course progress for each course under the department
    const courseProgress = await CourseSummaryService.getCourseProgressUnderDepartment(departmentId);

    const progressMap:{ [key: string]: any } = {};
        courseProgress.forEach(p => {
            progressMap[p._id.toString()] = p;
        });


    return new ApiResponse(200, {
        department: {
            _id: department._id,
            name: department.name,
            description: department.description,
            departmentCourseStatus: departmentCourseStatus,
            organization: {
                _id: organization._id,
                name: organization.name,
                logo_url: organization.logo_url,
                admin: organization.admin,
                organization_admin_email: organization.organization_admin_email
            },
            courses: courses.map(course => ({
                _id: course._id,
                title: course.title,
                description: course.description,
                duration: course.duration,
                skills: course.skills,
                image_url: course.image_url,
                status: course.status,
                enrolledCount: course.enrolledEmployees?.length || 0,
                progressSummary: progressMap[course._id.toString()] || {
                    avgProgress: 0,
                    totalLearners: 0,
                    completedCount: 0,
                    inProgressCount: 0,
                    notStartedCount: 0
                }
            })),
            employees: employees.map(emp => ({
                _id: emp._id,
                name: emp.name,
                email: emp.email,
                avatar_url: (emp.personalInfo as IPersonalInfo)?.avatar_url,
                skills:emp.employeeData?.skills,
                accountType: emp.accountType,
                department: emp.employeeData?.department,
                organization: emp.employeeData?.organization,
                courseStats: memberStatusMap[emp._id.toString()] || {
                    completed: 0,
                    inProgress: 0,
                    percentage: 0
                }
            })),
            statistics: {
                totalCourses: courses.length,
                totalEmployees: employees.length,
                totalEnrollments: totalEnrollments
            }
        }
    }, 'Department details fetched successfully').send(res);
});






// export const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
//     const { departmentId } = req.body;
//     const adminId = req.user?._id;

//     console.log("departmentId", departmentId);
//     console.log("adminId", adminId);

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     if (!departmentId) {
//         throw new ApiError(400, 'Department ID is required');
//     }

//     // Get department with populated courses
//     const department = await DepartmentModel.findById(departmentId)
//         .populate<PopulatedDepartment>({
//             path: 'courses',
//             select: 'title description duration skills image_url status enrolledEmployees'
//         });

//     if (!department) {
//         throw new ApiError(404, 'Department not found');
//     }

//     // Verify admin has access to this department's organization--> only then able to get department details
//     const organization = await OrganizationModel.findOne({
//         _id: department.organization,
//         admin: adminId
//     });

//     if (!organization) {
//         throw new ApiError(403, 'Access denied to this department');
//     }

//     // Get employees in department
//     const employees = await UserModel.find({
//         'employeeData.department': departmentId,
//         accountType: 'employee'
//     }).populate('personalInfo');

//     if(!employees){
//         throw new ApiError(404, 'No employees found');
//     }

//     // Get course statistics
//     const courses = department.courses as IPopulatedCourse[];
//     const totalEnrollments = courses.reduce((sum, course) => 
//         sum + (course.enrolledEmployees?.length || 0), 0
//     );

//     //course Status under department
//     const DepartmentCourseStatus = CourseSummaryService.getDepartmentCourseStatus(departmentId)

    


//     return new ApiResponse(200, {
//         department: {
//             _id: department._id,
//             name: department.name,
//             description: department.description,
//             DepartmentCourseStatus,
//             organization: {
//                 _id: organization._id,
//                 name: organization.name,
//                 logo_url: organization.logo_url,
//                 admin: organization.admin,
//                 organization_admin_email: organization.organization_admin_email
//             },
//              courses: courses.map(course => ({
//                 _id: course._id,
//                 title: course.title,
//                 description: course.description,
//                 duration: course.duration,
//                 skills: course.skills,
//                 image_url: course.image_url,
//                 status: course.status,
//                 enrolledCount: course.enrolledEmployees?.length || 0
//             })),
//             employees: employees.map(emp => ({
//                 _id: emp._id,
//                 name: emp.name,
//                 email: emp.email,
//                 avatar_url: (emp.personalInfo as IPersonalInfo)?.avatar_url,
//                 skills: emp.skills,
//                 accountType: emp.accountType,
//                 department: emp.employeeData?.department,
//                 organization: emp.employeeData?.organization


//             })),
//             statistics: {
//                 totalCourses: courses.length,
//                 totalEmployees: employees.length,
//                 totalEnrollments: totalEnrollments
//             }
//         }
//     }, 'Department details fetched successfully').send(res);
// });




// Get All Departments--> we can remove this api



export const getAllDepartments = asyncHandler(async (req: Request, res: Response) => {
    const { organizationId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!organizationId) {
        throw new ApiError(400, 'Organization ID is required');
    }

    // Check admin owns the organization
    const organization = await OrganizationModel.findOne({ _id: organizationId, admin: adminId });
    if (!organization) {
        throw new ApiError(403, 'Access denied or organization not found');
    }

    // Fetch departments
    const departments = await DepartmentModel.find({ organization: organizationId })
        .populate<PopulatedDepartment>({
            path: 'courses',
            select: 'title status enrolledEmployees'
        });

    if (departments.length === 0) {
        throw new ApiError(404, 'No departments found');
    }

    // Generate stats for each department
    const departmentsWithStats = await Promise.all(
        departments.map(async (dept) => {
            const employees = await UserModel.find({
                'employeeData.department': dept._id,
                accountType: 'employee'
            });

            const courses = dept.courses as IPopulatedCourse[];
            const totalEnrollments = courses.reduce(
                (sum, course) => sum + (course.enrolledEmployees?.length || 0),
                0
            );

            return {
                _id: dept._id,
                name: dept.name,
                description: dept.description,
                courses: courses.map(course => ({
                    _id: course._id,
                    title: course.title,
                    status: course.status,
                    enrolledCount: course.enrolledEmployees?.length || 0
                })),
                statistics: {
                    totalCourses: courses.length,
                    totalEmployees: employees.length,
                    totalEnrollments
                }
            };
        })
    );

    return new ApiResponse(200, {
        departments: departmentsWithStats
    }, 'Departments fetched successfully').send(res);
});




// Update Department
export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { Id: departmentId } = req.params;
    const { name, description } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!departmentId) {
        throw new ApiError(400, 'Department ID is required');
    }

    if (!name && !description) {
        throw new ApiError(400, 'Department name or description is required');
    }

    // Find the department
    const department = await DepartmentModel.findById(departmentId);
    if (!department) {
        throw new ApiError(404, 'Department not found');
    }

    // Verify admin access to the department's organization
    const organization = await OrganizationModel.findOne({
        _id: department.organization,
        admin: adminId
    });

    if (!organization) {
        throw new ApiError(403, 'Access denied to this department');
    }

    // Check for duplicate department name within the same organization
    if (name && name !== department.name) {
        const duplicate = await DepartmentModel.findOne({
            organization: department.organization,
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            _id: { $ne: departmentId }
        });

        if (duplicate) {
            throw new ApiError(400, 'Department with this name already exists in the organization');
        }
    }

    // Update 
    department.name = name || department.name;
    department.description = description || department.description;
    await department.save();

    return new ApiResponse(200, {
        department: {
            _id: department._id,
            name: department.name,
            description: department.description
        }
    }, 'Department updated successfully').send(res);
});






// Delete Department--> need to revisit
export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { departmentId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!departmentId) {
        throw new ApiError(400, 'Department ID is required');
    }               

    // Check if department exists
    const department = await DepartmentModel.findById(departmentId);

    if (!department) {
        throw new ApiError(404, 'Department not found');
    }

    // Verify admin has access to this department's organization --> only then able to delete department
    const organization = await OrganizationModel.findOne({
        _id: department.organization,
        admin: adminId
    });

    if (!organization) {
        throw new ApiError(403, 'Access denied to this department');
    }

    // Delete department
    await DepartmentModel.findByIdAndDelete(departmentId);

    return new ApiResponse(200, {}, 'Department deleted successfully').send(res);
});





// Update Department Assignment
// export const updateDepartmentAssignment = asyncHandler(async (req: Request, res: Response) => {
//     const { employeeId, newDepartmentId } = req.body;
//     const adminId = req.user?._id;

//     // Input validation
//     if (!employeeId || !newDepartmentId) {
//         throw new ApiError(400, 'Employee ID and New Department ID are required');
//     }

//     if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(newDepartmentId)) {
//         throw new ApiError(400, 'Invalid ID format');
//     }

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     // Check if employee exists and is actually an employee
//     const employee = await UserModel.findOne({
//         _id: employeeId,
//         accountType: 'employee'
//     });

//     if (!employee) {
//         throw new ApiError(404, 'Employee not found or invalid accountType');
//     }

//     // Check if new department exists and belongs to admin's organization
//     const newDepartment = await DepartmentModel.findOne({
//         _id: newDepartmentId,
//         organization: { $in: await OrganizationModel.find({ admin: adminId }).distinct('_id') }
//     });

//     if (!newDepartment) {
//         throw new ApiError(404, 'New department not found or access denied');
//     }

//     // Check if employee's current organization matches the new department's organization
//     if (employee.employeeData.organization?.toString() !== newDepartment.organization.toString()) {
//         throw new ApiError(400, 'Employee must belong to the same organization as the department');
//     }

//     // Check if employee is already in the new department
//     if (employee.employeeData.department?.toString() === newDepartmentId) {
//         throw new ApiError(400, 'Employee already belongs to this department');
//     }

//     // Update employee's department
//     employee.employeeData.department = newDepartmentId;

//     // Save changes with error handling
//     try {
//         await employee.save();
        
//         return new ApiResponse(200, {
//             message: 'Employee department assignment updated successfully',
//             data: {
//                 employeeId: employee._id,
//                 newDepartmentId: newDepartment._id
//             }
//         }).send(res);
//     } catch (error) {
//         throw new ApiError(500, 'Failed to update employee department assignment');
//     }
// });
    
    
    
    

