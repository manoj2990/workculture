import { Document, Schema, ObjectId, Types } from 'mongoose';
import { accountType } from './common.types';

export interface IPersonalInfo extends Document {
    _id: Schema.Types.ObjectId;
    employeeName: string;
    avatar_url?: string;
    user: Schema.Types.ObjectId;
    dateOfBirth?: Date;
    phoneNumber?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    emergencyContact?: {
        name: string;
        relationship: string;
        phoneNumber: string;
    };
    createdAt: Date;
    updatedAt: Date;
}



export interface IUser extends Document {
    _id: Schema.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    accountType: accountType;
    jobTitle: string;
    createdBySuperAdmin?: Schema.Types.ObjectId;
    personalInfo: Schema.Types.ObjectId | (IPersonalInfo & { _id: Schema.Types.ObjectId });
    created_orgs?: Schema.Types.ObjectId[];
    adminLimits?: {
        maxOrganizations: number;
        maxCourses: number;
        maxDepartments: number;
        maxEmployees: number;
        maxEmployeesPerOrg: Array<{
            orgID:  Types.ObjectId;
            limit: number;
        }>;
        maxEmployeesPerCourse: Array<{
            courseID: Types.ObjectId;
            limit: number;
        }>;
        maxEmployeesPerCourseDefault: number;
    };
    employeeData: {
        organization?: string;
        department?: string;
        enrolledCourses?: string[];
        skills?: string[];
    };
   
    accountStatus: 'active' | 'inactive'  | 'blocked';
    createdAt: Date;
    updatedAt: Date;
}