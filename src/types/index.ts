import { Document, Schema, ObjectId } from 'mongoose';
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

// export interface IUser extends Document {
//     _id: Schema.Types.ObjectId;
//     name: string;
//     email: string;
//     password: string;
//     accountType: accountType;
//     jobTitle: string;
//     createdBySuperAdmin?: Schema.Types.ObjectId;
//     personalInfo: Schema.Types.ObjectId | (IPersonalInfo & { _id: Schema.Types.ObjectId });
//     created_orgs?: Schema.Types.ObjectId[];
//     adminLimits?: {
//         maxOrganizations: number;
//         maxCourses: number;
//         maxDepartments: number;
//         maxEmployees: number;
//         maxEmployeesPerOrg: Array<{
//             orgID: Schema.Types.ObjectId;
//             limit: number;
//         }>;
//         // maxEmployeesPerDept: number;
//         maxEmployeesPerCourse: number;
//     };
//     employeeData: {
//         organization?: string;
//         department?: string;
//         enrolledCourses?: string[];
//     };
//     skills?: string[];
//     accountStatus: 'active' | 'inactive' | 'blocked';
//     createdAt: Date;
//     updatedAt: Date;
// }

export interface IOrganization extends Document {
    _id: Schema.Types.ObjectId;
    name: string;
    organization_admin_email: string;
    admin: Schema.Types.ObjectId;
    logo_url?: string;
    departments: Schema.Types.ObjectId[];
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
    enrolledEmployees?: Schema.Types.ObjectId[];
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

export interface PopulatedDepartment extends Omit<IDepartment, 'courses'> {
    courses: IPopulatedCourse[];
}

export interface DepartmentWithStats extends PopulatedDepartment {
    statistics: {
        totalCourses: number;
        totalEmployees: number;
        totalEnrollments: number;
    };
}

export interface IAccessRequest extends Document {
    employee: Schema.Types.ObjectId;
    course: Schema.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected' | 'revoked';
    requestedAt: Date;
    reviewedBy?: Schema.Types.ObjectId;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITopic extends Document {
    course: Schema.Types.ObjectId;
    title: string;
    description?: string;
    order?: number;
    subtopics: Schema.Types.ObjectId[] | string[] | ISubtopic[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IPopulatedTopic extends Omit<ITopic, 'subtopics'> {
    subtopics: ISubtopic[];
}

export interface ISubtopic extends Document {
    _id: Schema.Types.ObjectId;
    title: string;
    description?: string;
    order: number;
    topic: Schema.Types.ObjectId;
    contentType: 'text' | 'video' | 'file' | 'link';
    text_content?: string;
    video?: {
        name: string;
        url: string;
        public_id?: string;
    };
    files?: {
        name: string;
        url: string;
        public_id?: string;
        type: string;
    }[];
    links?: {
        title: string;
        url: string;
    }[];
    assessments: Schema.Types.ObjectId[] | string[] | Iassessments[];
    createdAt: Date;
    updatedAt: Date;
}



export interface Iassessments extends Document {
    _id: Schema.Types.ObjectId;
    subtopic: Schema.Types.ObjectId;
    assessments_title: string;
    order: number;
    questions: Schema.Types.ObjectId[] | string[] | IQuestion[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IQuestion extends Document {
    _id: Schema.Types.ObjectId;
    assessmentsId: Schema.Types.ObjectId;
    order: number;
    questionText: string;
    questionType: 'multiple_choice' | 'descriptive' | 'video' | 'audio';
    options?: {
        value: string;
        label: string;
    }[];
    correctAnswers?: string[];
    sampleAnswer?: string;
    instructions?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Request and Response Types
export interface AuthRequest {
    body: {
        name?: string;
        email?: string;
        password?: string;
        accountType?: accountType;
        createdBySuperAdmin?: string;
        adminLimits?: {
            maxOrganizations?: number;
            maxCourses?: number;
            maxDepartments?: number;
            maxEmployees?: number;
            maxEmployeesPerOrg?: number;
            maxEmployeesPerDept?: number;
            maxEmployeesPerCourse?: number;
        };
    };
    user?: IUser;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user?: Partial<IUser>;
        token?: string;
        admin?: Partial<IUser>;
    };
}

export interface PopulatedOrganization extends Omit<IOrganization, 'departments'> {
    departments: PopulatedDepartment[];
}

export type OrganizationDocument = Document & IOrganization;
export type PopulatedOrganizationDocument = Document & PopulatedOrganization;

export interface ICourseCreation {
    // Step 1: Basic Info
    title: string;
    description?: string;
    duration?: string;
    skills?: string[];
    image_url?: string;
    instructors: string[];
    organizations: string[];
    departments: string[];
    
    // AI Settings
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

export interface ITopicCreation {
    title: string;
    description?: string;
    course: string; // courseId
    subtopics?: ISubtopicCreation[];
}

export interface ISubtopicCreation {
    title: string;
    description?: string;
    contentType: 'text' | 'video' | 'file' | 'link';
    text_content?: string;
    video?: {
        url?: string;
        file?: any; // This will be the actual file upload
    };
    files?: {
        name: string;
        url?: string;
        file?: any; // This will be the actual file upload
        type: 'file' | 'url';
    }[];
    links?: {
        title: string;
        url: string;
        description?: string;
    }[];
}

export interface IAssessmentCreation {
    subtopic: string; // subtopicId
    questions: {
        questionText: string;
        questionType: 'multiple_choice' | 'descriptive' | 'video' | 'audio';
        options?: {
            value: string;
            label: string;
        }[];
        correctAnswers?: string[];
        sampleAnswer?: string;
        instructions?: string;
    }[];
}

export interface ICoursePublish {
    courseId: string;
    visibility: {
        organizationId: string;
        departments: string[];
    }[];
    status: 'draft' | 'published';
} 