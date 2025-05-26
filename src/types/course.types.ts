
import mongoose, { Schema, Types } from 'mongoose';
import { Iassessments } from './index';

export interface ILinkedEntity {
    organization: {
        _id: Types.ObjectId;
        name: string;
    };
    departments: Array<{
        _id: Types.ObjectId;
        name: string;
    }>;
}


export interface ICourse {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    duration?: string;
    skills?: string[];
    image_url?: string;
    instructors: string[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
    linked_entities: ILinkedEntity[];
    ai_settings?: {
        persona_prompt?: string;
        ability_prompt?: string;
        rag_documents?: Array<{
            name: string;
            url: string;
            vectorized: boolean;
        }>;
    };
    topics: ITopic[];
    createdByAdmin: IUser;
    enrolledEmployees: IUser[];
}

export interface ITopic {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    order?: number;
    subtopics: Array<{
        _id: Types.ObjectId;
        title: string;
        description?: string;
        order: number;
        contentType: string;
        text_content?: string;
        video?: {
            name?: string;
            url?: string;
            public_id?: string;
        };
        files?: Array<{
            name?: string;
            url?: string;
            public_id?: string;
            type?: string;
        }>;
        links?: Array<{
            title?: string;
            url?: string;
        }>;
        assessments?: Array<{
            _id: Types.ObjectId;
            assessments_title: string;
            order?: number;
            questions: Array<{
                _id: Types.ObjectId;
                questionText: string;
                questionType: string;
                options?: Array<{ value: string; label: string }>;
                correctAnswers?: string[];
                sampleAnswer?: string;
                instructions?: string;
                order: number;
            }>;
        }>;
    }>;
}


export interface ISubtopic {
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

export interface IUser {
    _id: Types.ObjectId ;
    name: string;
    email: string;
    
    
}

