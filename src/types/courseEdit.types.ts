import { Types } from 'mongoose';
import { ICourse } from './course.types';

// Response types for getFullCourseDetails
export interface ICourseEditResponse {
    basicInfo: {
        _id: Types.ObjectId;
        title: string;
        description?: string;
        duration?: string;
        skills?: string[];
        image_url?: string;
        instructors: string[];
        status: string;
        organizations: Array<{
            _id: string;
            name: string;
            departments: Array<{
                _id: string;
                name: string;
            }>;
        }>;
    };

    aiSettings: {
        persona_prompt: string;
        ability_prompt: string;
        rag_documents: Array<{
            name: string;
            url: string;
            vectorized: boolean;
        }>;
    };

    content: Array<{
        _id: Types.ObjectId;
        title: string;
        description?: string;
        order?: number;
        subtopics: Array<{
            _id: Types.ObjectId;
            title: string;
            description?: string;
            order?: number;
            contentType: string;
            content: {
                text?: string;
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
            };
        }>;
    }>;

    assessments: Array<{
        topicId: Types.ObjectId;
        topicTitle: string;
        subtopicId: Types.ObjectId;
        subtopicTitle: string;
        _id: Types.ObjectId;
        title: string;
        order: number;
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
}

// Type for the populated course used in getFullCourseDetails
export type IPopulatedCourseForEdit = Omit<ICourse, 'createdAt' | 'updatedAt' | 'createdByAdmin' | 'enrolledEmployees'>; 