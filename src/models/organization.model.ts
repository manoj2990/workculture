import { Schema, model, Document } from 'mongoose';
import { IOrganization } from '@/types';

const organizationSchema = new Schema<IOrganization>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    organization_admin_email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    logo_url: {
        type: String,
        trim: true
    },
    departments: [{
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    }]
}, {
    timestamps: true
});

export default model<IOrganization>('Organization', organizationSchema); 