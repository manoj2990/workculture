import { Schema, model, Document } from 'mongoose';
import { ISubtopic } from '@/types';


//Review: currently  i use this schema after dicussion with mohit sir
// old schema is below--> which one is correct?

const subtopicSchema = new Schema({
    topic: {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
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

    order: {
        type: Number,
        // required: true
    },

    contentType: {
        type: String,
        enum: ['text', 'video', 'file', 'link'],
        required: true
    },

    text_content: {
        type: String,
        trim: true
    },

    audioUrl: {
        url:{ type: String, trim: true},
        public_id: {type: String, trim: true},
    },

    imageUrl: {
        name: {type: String, trim: true},
        url:{ type: String, trim: true},
        public_id: {type: String, trim: true},
    },
      

    video: {
        name: {type: String, trim: true},
        url:{ type: String, trim: true},
        public_id: {type: String, trim: true},
    },

    files: [{
        type: {type: String, trim: true},
        name: {type: String, trim: true},
        url: { type: String, trim: true},
        public_id: {type: String, trim: true},
    }],

    links: [{
        title: {type: String, trim: true },
        url: {type: String, trim: true }
    }],

    assessments: [{
        type: Schema.Types.ObjectId,
        ref: 'assessments'
    }]
}, {
    timestamps: true
});
















//-------> old schema
// const subtopicSchema = new Schema<ISubtopic>({
//     topic: {
//         type: Schema.Types.ObjectId,
//         ref: 'Topic',
//         required: true
//     },
    
//     title: {
//         type: String,
//         required: true,
//         trim: true
//     },

//     order: {
//         type: Number,
//         required: true
//     },

//     description: {
//         type: String,
//         trim: true
//     },

//     contentType: {
//         type: String,
//         enum: ['text', 'video', 'file', 'link'],
//         required: true
//     },


//     text_content: {
//         type: String,
//         trim: true
//     },

//     video: {
//         type: String,
//         trim: true
//     },

//     attachments: [
//     {
//         name: {
//             type: String,
//             required: true
//         },
//         url: {
//             type: String,
//             required: true
//         },
//         type: {
//             type: String,
//             enum: ['file', 'link'],
//             required: true
//         }
//     }],

//     assessmentss: [{
//         type: Schema.Types.ObjectId,
//         ref: 'assessments'
//     }]
// }, {
//     timestamps: true
// });

export default model('Subtopic', subtopicSchema); 