import { Schema, model, Document } from 'mongoose';
import { IQuestion } from '../types';

const questionSchema = new Schema({
    assessmentsId: {
        type: Schema.Types.ObjectId,
        ref: 'assessments',
        required: true
    },

    order: {
        type: Number,
        // require: true
    },

    questionText: {
        type: String,
        required: true
    },

    questionType: {
        type: String,
        enum: ['multiple_choice', 'descriptive', 'video', 'audio'],
        required: true
    },

    options: [{
        value: String,
        label: String
    }],

    correctAnswers: [String],

    sampleAnswer: String,

    instructions: String
    
}, { timestamps: true });

export default model('Question', questionSchema); 