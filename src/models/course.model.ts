import { Schema, model, Document } from 'mongoose';
import { ICourse } from '../types';

const courseSchema = new Schema<ICourse>({
    createdByAdmin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    duration: {
        type: String,
        trim: true
    },

    skills: [{
        type: String,
        trim: true
    }],

    image_url: {
        type: String,
        trim: true
    },

    instructors: [{
        type: String,
        required: true
    }],

    linked_entities: [{
        organization: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        departments: [{
            type: Schema.Types.ObjectId,
            ref: 'Department',
            required: true
        }]
    }],

    ai_settings: {
        persona_prompt: {
            type: String,
            trim: true
        },
        ability_prompt: {
            type: String,
            trim: true
        },

        //Review: i think this is not correct--> please suggest what should be the approch for this?
        // i think i should only store the complete rag documents in the database or just the url after uploding on cloudinary?
        //we only store 1 rag document, right?
        rag_documents: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            url: {
                type: String,
                required: true,
                trim: true
            },
            vectorized: {
                type: Boolean,
                default: false
            }
        }]
    },

    topics: [{
        type: Schema.Types.ObjectId,
        ref: 'Topic'
    }],

    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    
    enrolledEmployees: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

export default model<ICourse>('Course', courseSchema); 