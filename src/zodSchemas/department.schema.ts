import { z } from 'zod';

// Base department schema
export const departmentSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    name: z.string().min(1, "Department name is required").trim(),
    description: z.string().optional(),
    courses: z.array(z.string()).optional(),
    adminId:z.string()
});

// // Department creation schema
// export const departmentCreationSchema = z.object({
//     body: departmentSchema
// });

// Department update schema
export const departmentUpdateSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
   departmentId: z.string().min(1, "Department ID is required"),
    name: z.string().min(1, "Department name is required").trim().optional(),
    description: z.string().optional(),
    courses: z.array(z.string()).optional(),
    adminId:z.string()
});

// // Department ID schema
// export const departmentIdSchema = z.object({
//     params: z.object({
//         id: z.string().min(1, "Department ID is required")
//     })
// }); 