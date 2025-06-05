import { z } from 'zod';

// Base organization schema
export const organizationSchema = z.object({
    id: z.string().min(1, "Organization ID is required").optional(),
    name: z.string().min(1, "Organization name is required").trim(),
    organization_admin_email: z.string().email("Invalid admin email format"),
    logo_url: z.string().url("Invalid logo URL").optional(),
    departments: z.array(z.string()).optional(),
    adminId:z.string()
});


export const updateOrganizationSchema = z.object({
    id: z.string().min(1, "Organization ID is required"),
    name: z.string().min(1, "Organization name is required").trim().optional(),
    organization_admin_email: z.string().email("Invalid admin email format").optional(),
    logo_url: z.string().url("Invalid logo URL").optional()
});

// // Organization creation schema
// export const organizationCreationSchema = z.object({
//     body: organizationSchema
// });

// // Organization update schema
// export const organizationUpdateSchema = z.object({
//     params: z.object({
//         id: z.string().min(1, "Organization ID is required")
//     }),
//     body: organizationSchema.partial()
// });

// // Organization ID schema
// export const organizationIdSchema = z.object({
//     params: z.object({
//         id: z.string().min(1, "Organization ID is required")
//     })
// }); 