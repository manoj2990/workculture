
import { Schema, model } from 'mongoose';

const userAnswerSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assessmentId: {
        type: Schema.Types.ObjectId,
        ref: 'assessments',
        required: true
    },
    questionId: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    questionType: {
        type: String,
        enum: ['multiple_choice', 'descriptive', 'video', 'audio'],
        required: true
    },
    answer: {
        type: Schema.Types.Mixed, 
        required: true,
    },
    public_id: { 
        type: String,
         trim: true 
    },

    isCorrect: {
        type: Boolean,  
        default: null
    },
    reviewed: {
        type: Boolean,  
        default: false
    }
}, { timestamps: true });

export default model('userAnswer', userAnswerSchema);
