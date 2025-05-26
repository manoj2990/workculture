import { IPersonalInfo } from '@/types';
import { Schema, model, Document } from 'mongoose';

// interface IPersonalInfo extends Document {
//     employeeName: string;
//     avatar_url?: string;
//     user: Schema.Types.ObjectId;
  
//     dateOfBirth?: Date;
//     phoneNumber?: string;
//     address?: {
//         street?: string;
//         city?: string;
//         state?: string;
//         country?: string;
//         zipCode?: string;
//     };
//     emergencyContact?: {
//         name: string;
//         relationship: string;
//         phoneNumber: string;
//     };
// }



const personalInfoSchema = new Schema<IPersonalInfo>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    employeeName: {
        type: String,
        required: true,
        trim: true
    },
    avatar_url: {
        type: String,
        trim: true,
        default: null
    },
    dateOfBirth: {
        type: Date,
        trim: true,
        default: null
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: null
    },
    address: {
        street: {
            type: String,
            trim: true,
            default: null
        },
        city: {
            type: String,
            trim: true,
            default: null
        },
        state: {
            type: String,
            trim: true,
            default: null
        },
        country: {
            type: String,
            trim: true,
            default: null
        },
        zipCode: {
            type: String,
            trim: true,
            default: null
        }
    },
    emergencyContact: {
        name: {
            type: String,
            trim: true,
            default: null
        },
        relationship: {
            type: String,
            trim: true,
            default: null
        },
        phoneNumber: {
            type: String,
            trim: true,
            default: null
        }
    }
}, {
    timestamps: true
});

export default model<IPersonalInfo>('PersonalInfo', personalInfoSchema); 