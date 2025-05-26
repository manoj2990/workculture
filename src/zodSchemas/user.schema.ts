import { z } from 'zod';

// Base user schema
// export const userSchema = z.object({
//     name: z.string().min(1, "Name is required"),
//     email: z.string().email("Invalid email format"),
//     password: z.string().min(6, "Password must be at least 6 characters"),
//     accountType: z.enum(['superadmin', 'admin', 'employee'], {
//         required_error: "accountType is required",
//         invalid_type_error: "Invalid accountType"
//     }).optional(),
//     profile: z.object({
//         full_name: z.string().min(1, "Full name is required"),
//         avatar_url: z.string().optional()
//     }).optional(),
//     adminLimits: z.object({
//         maxOrganizations: z.number().min(0),
//         maxCourses: z.number().min(0),
//         maxDepartments: z.number().min(0),
//         maxEmployees: z.number().min(0),
//         maxEmployeesPerOrg: z.number().min(0),
//         maxEmployeesPerDept: z.number().min(0),
//         maxEmployeesPerCourse: z.number().min(0)
//     }).optional(),
//     employeeData: z.object({
//         organization: z.string().optional(),
//         department: z.string().optional(),
//         enrolledCourses: z.array(z.string()).optional()
//     }).optional()
// });


// Update profile schema
// export const updateProfileSchema = z.object({
//     body: z.object({
//         name: z.string().min(2, "Name must be at least 2 characters").optional(),
//         email: z.string().email("Invalid email format").optional(),
//         profile: z.object({
//             full_name: z.string().min(2, "Full name must be at least 2 characters").optional(),
//             avatar_url: z.string().url("Invalid URL format").optional()
//         }).optional()
//     })
// });

// Change password schema-->nested body object
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(2, "Current password must be at least 2 characters"),
    newPassword: z.string().min(2, "New password must be at least 2 characters")
  });


// Update Admin schema
export const updateAdminSchema = z.object({
  adminId: z.string().min(1, "Admin ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  accountStatus: z.enum(['active', 'inactive'], {
    required_error: "accountStatus is required",
    invalid_type_error: "Invalid accountStatus"
  }).optional()
  })



export const updateAdminLimitsSchema = z.object({
  newLimits: z.object({
    maxOrganizations: z.number().min(0),
    maxCourses: z.number().min(0),
    maxDepartments: z.number().min(0),
    maxEmployees: z.number().min(0),
    maxEmployeesPerOrg: z.array(z.object({
      orgID: z.string().min(1, "Organization ID is required"),
      limit: z.number().min(0)
    })).optional(),
    maxEmployeesPerCourseDefault: z.number().min(0).optional(),
    maxEmployeesPerCourse: z.array(z.object({
      courseID: z.string().min(1, "Course ID is required"),
      limit: z.number().min(0)
    })).optional()
  }),
  adminId: z.string().min(1, "Admin ID is required")
});



