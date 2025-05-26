import { Schema, model, Document, Types } from 'mongoose';
import { ITopic } from '@/types';



const topicSchema = new Schema<ITopic>({
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

    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
      },
      
    subtopics: [{
        type: Schema.Types.ObjectId,
        ref: 'Subtopic'
    }]
}, {
    timestamps: true
});

export default model<ITopic>('Topic', topicSchema); 


//1. we create the multiple topics--> multiple subtopic --> courses at once right?

//data i expect from the frontend

// {
//     "topics": [
//       { --> this is topic
//         "title": "HTML Basics",
//         "description": "Introduction to HTML structure and syntax.",
//         "subtopics": [
//           { --> this is subtopic
//             "title": "What is HTML?",
//             "description": "Explains the foundation of web development.",
//             "contentType": "text",
//             "textContent": "HTML (HyperText Markup Language) is the standard markup language for creating web pages.",
//             "videoUrl": "",
//             "fileUrl": ""
//           },
//           { --> this is subtopic
//             "title": "HTML Tags PDF",
//             "description": "A downloadable PDF for HTML tag reference.",
//             "contentType": "file",
//             "textContent": "",
//             "videoUrl": "",
//             "fileUrl": "https://cloud-storage.com/files/html-tags.pdf"
//           }
//         ]
//       },
//       { --> this is topic
//         "title": "CSS Fundamentals",
//         "description": "Covers basic CSS styling techniques.",
//         "subtopics": [
//           { --> this is subtopic
//             "title": "Inline vs External CSS",
//             "description": "Video tutorial explaining the differences.",
//             "contentType": "video",
//             "textContent": "",
//             "videoUrl": "https://cdn.videos.com/css-inline-vs-external.mp4",
//             "fileUrl": ""
//           }
//         ]
//       },
//       { --> this is topic
//         "title": "JavaScript Essentials",
//         "description": "Learn variables, functions, and logic.",
//         "subtopics": [
//           { --> this is subtopic
//             "title": "JavaScript Variables",
//             "description": "Text explanation with examples.",
//             "contentType": "text",
//             "textContent": "In JS, use `let`, `const`, or `var` to declare variables depending on scope and reassignability.",
//             "videoUrl": "",
//             "fileUrl": ""
//           },
//           { --> this is subtopic
//             "title": "Practice Questions",
//             "description": "JS quiz questions PDF.",
//             "contentType": "file",
//             "textContent": "",
//             "videoUrl": "",
//             "fileUrl": "https://files.example.com/js-questions.pdf"
//           }
//         ]
//       }
//     ]
//   }
  