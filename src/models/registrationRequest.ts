

import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistrationRequest extends Document {
  user: mongoose.Types.ObjectId;
  accountType: 'employee' | 'individual';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
}

const RegistrationRequestSchema = new Schema<IRegistrationRequest>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountType: {
    type: String,
    enum: ['employee', 'individual'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
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
  },
  reviewNotes: {
    type: String
  }
});

export default mongoose.model<IRegistrationRequest>('RegistrationRequest', RegistrationRequestSchema);
