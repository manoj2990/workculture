// import { z } from 'zod';

// // Login schema
// export const loginSchema = z.object({
//     email: z.string().email("Invalid email format"),
//     password: z.string().min(1, "Password is required")
// });

// // Signup schema
// export const signupSchema = z.object({
//     email: z.string().email("Invalid email format"),
//     password: z.string().min(6, "Password must be at least 6 characters"),
//     firstName: z.string().min(1, "First name is required"),
//     lastName: z.string().min(1, "Last name is required"),
//     organization: z.string().min(1, "Organization is required"),
    // accountType: z.enum(['superadmin', 'admin', 'employee'], {
    //     required_error: "accountType is required",
    //     invalid_type_error: "Invalid accountType"
    // })
// }); 


// // Email verification schema
// export const emailVerificationSchema = z.object({
//     params: z.object({
//         token: z.string().min(1, "Verification token is required")
//     })
// });

// // Password reset request schema
// export const passwordResetRequestSchema = z.object({
//     body: z.object({
//         email: z.string().email("Invalid email format")
//     })
// });

// // Password reset schema
// export const passwordResetSchema = z.object({
//     body: z.object({
//         token: z.string().min(1, "Reset token is required"),
//         password: z.string().min(6, "Password must be at least 6 characters")
//     })
// });

// // Refresh token schema
// export const refreshTokenSchema = z.object({
//     body: z.object({
//         refreshToken: z.string().min(1, "Refresh token is required")
//     })
// }); 



import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: "Valid email is required" }),
    password: z.string().min(2, { message: "Password must be at least 2 characters" })
});




export const signupSchema = z.object({
    email: z.string().email({ message: "Valid email is required" }),
    password: z.string().min(2, { message: "Password must be at least 2 characters" }),
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    accountType: z.enum(['superadmin', 'admin', 'employee', 'individual'], {
        required_error: "accountType is required",
        invalid_type_error: "Invalid accountType"
    }),
    jobTitle: z.string().optional(),
    otp: z.string().length(6, { message: "OTP must be 6 characters" }).optional(),
    organization: z
    .string()
    .refine(isValidObjectId, { message: 'Invalid organization ObjectId' })
    .optional(),
  department: z
    .string()
    .refine(isValidObjectId, { message: 'Invalid department ObjectId' })
    .optional(),
}).superRefine((data, ctx) => {
    if (data.accountType === "employee") {
        if (!data.organization) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["organization"],
                message: "Organization is required for employee accountType"
            });
        }
        if (!data.department) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["department"],
                message: "Department is required for employee accountType"
            });
        }
        if (!data.jobTitle) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["jobTitle"],
                message: "Job title is required for employee accountType"
            });
        }
        if (!data.otp || data.otp.length !== 6) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["otp"],
                message: "OTP is required and must be 6 characters for employee accountType"
            });
        }
    }

    if (data.accountType === "individual") {
        if (!data.otp || data.otp.length !== 6) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["otp"],
                message: "OTP is required and must be 6 characters for individual accountType"
            });
        }
    }
    
});




export const refreshTokenSchema = z.object({
    refreshToken: z.string({ message: "Refresh token is required" })
});



export const emailVerificationSchema = z.object({
    token: z.string({ message: "Verification token is required" })
});



export const passwordResetRequestSchema = z.object({
    email: z.string().email({ message: "Valid email is required" })
});




export const passwordResetSchema = z.object({
    email: z.string().email({ message: "Valid email is required" }),
    otp: z.string().length(6, { message: "OTP must be 6 characters" }),
    newPassword: z.string().min(2, { message: "Password must be at least 2 characters" })
});



export const sendOTPSchema = z.object({
    email: z.string().email({ message: "Valid email is required" })
});

