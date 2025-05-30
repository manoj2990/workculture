import { Schema, model, Document } from 'mongoose';
import { IDepartment } from '@/types';
import Organization from './organization.model';

const departmentSchema = new Schema<IDepartment>({
    // admin:{
    //     type: Schema.Types.ObjectId,
    //     ref: 'User',
    //     required: true
    // },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    courses: [{
        type: Schema.Types.ObjectId,
        ref: 'Course'
    }]
}, {
    timestamps: true
});


//ye esure krega ki jo department create hoga uska organization exist krega
departmentSchema.pre('save', async function(next) {
    const org = await Organization.findById(this.organization);
    if (!org) {
        throw new Error('Invalid organization reference');
    }
    next();
});



export default model<IDepartment>('Department', departmentSchema); 