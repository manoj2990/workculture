
import { Schema } from 'mongoose';
import { ITopic } from './course.types';
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
        maxEmployeesPerOrg: number;
        maxEmployeesPerDept: number;
        maxEmployeesPerCourse: number;
    };
    employeeData?: {
        organization?: string;
        department?: string;
        enrolledCourses?: string[];
    };
    skills?: string[];
    accountStatus: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}




export interface IDepartment extends Document {
    _id: Schema.Types.ObjectId;
    name: string;
    description?: string;
    organization: Schema.Types.ObjectId;
    courses: Schema.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    employeeCount?: number;
}



export interface ICourseBase {
    _id: string;
    createdByAdmin: Schema.Types.ObjectId;
    title: string;
    description?: string;
    duration?: string;
    skills?: string[];
    image_url?: string;
    status: 'draft' | 'published';
    enrolledEmployees?: string[];
    ai_settings?: {
        persona_prompt?: string;
        ability_prompt?: string;
        rag_documents?: {
            name: string;
            url: string;
            vectorized: boolean;
        }[];
    };
}

export interface ICourse extends ICourseBase {
    instructors: string[];
    linked_entities: {
        organization: string;
        departments: string[];
    }[];
    topics: Schema.Types.ObjectId[] | string[] | ITopic[];
    createdAt: Date;
    updatedAt: Date;
}


export interface IPopulatedCourse extends Omit<ICourse, 'topics'> {
    topics: ITopic[];
}