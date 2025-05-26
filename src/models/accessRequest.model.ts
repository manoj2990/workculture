import mongoose, { Schema, Document } from 'mongoose';
import userModel from './user.model';

export interface IAccessRequest extends Document {
    employee: Schema.Types.ObjectId;
    course: Schema.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected' | 'revoked';
    requestedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: Schema.Types.ObjectId;
    reviewNotes?: string;
}

const AccessRequestSchema: Schema = new Schema({
    employee: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'revoked'] ,
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});


//need to remove this pre save hook
AccessRequestSchema.pre('save', async function (next) {
    const accessRequest = this ;

    if (!accessRequest.isModified('status')) {
        return next(); // Don't proceed if status is not modified
    }

    try {
        const user = await userModel.findById(accessRequest.employee);
        if (!user) return next();

        const status = accessRequest.status;

        if (status === 'approved') {
            console.log(`Email sent to name:${user.name} , Access Request Approved, You have been approved for access to the course`);
            // await sendEmail(user.email, 'Access Request Approved', 'You have been approved for access to the course');
        } else if (status === 'rejected') {
            console.log(`Email sent to name:${user.name} , Access Request Rejected, Your access request has been rejected`);
            // await sendEmail(user.email, 'Access Request Rejected', 'Your access request has been rejected');
        } else if (status === 'revoked') {
            console.log(`Email sent to name:${user.name} , Access Request Revoked, Your access has been revoked`);
            // await sendEmail(user.email, 'Access Request Revoked', 'Your access request has been revoked');
        }

        next();
    } catch (error) {
        return next(error as any);
    }
});






export default mongoose.model<IAccessRequest>('AccessRequest', AccessRequestSchema); 
