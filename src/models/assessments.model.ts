import { Schema, model, Document } from 'mongoose';
// import { Iassessments } from '../types';

const assessmentsSchema = new Schema({
   
    subtopic: {
        type: Schema.Types.ObjectId,
        ref: 'Subtopic',
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    assessments_title: {
        type: String,
        required: true
    },
    description: { type: String, default: "" },
    order: {
        type: Number
    },
    questions: [{
        type: Schema.Types.ObjectId,
        ref: 'Question'
    }]
}, { timestamps: true });

export default model('assessments', assessmentsSchema); 


// 1. we create the multiple assessmentss for multiple subtopics at once right?


//data i expect from the frontend


// {
//     "courseId": "course_001",
//     "topicId":"topic_011"
//     "subtopics": [
//       {
//         "subtopicId": "subtopic_001",
//         "assessments": [
//           {
//             "title": "Subtopic 1 - Assessment 1",
//             "questions": [
//               {
//                 "type": "mcq",
//                 "questionText": "What is HTML?",
//                 "options": [
//                   "Markup Language",
//                   "Database",
//                   "Browser",
//                   "Server"
//                 ],
//                 "correctAnswer": "Markup Language"
//               },
//               {
//                 "type": "descriptive",
//                 "questionText": "Explain the difference between HTML and XML.",
//                 "sampleAnswer": "HTML is used for structuring web pages while XML stores data..."
//               }
//             ]
//           }
//         ]
//       },
//       {
//         "subtopicId": "subtopic_002",
//         "assessments": [
//           {
//             "title": "Subtopic 2 - Assessment 1",
//             "questions": [
//               {
//                 "type": "video",
//                 "questionText": "Demonstrate how to use semantic tags in HTML.",
//                 "instructions": "Please upload a short video with explanation."
//               },
//               {
//                 "type": "audio",
//                 "questionText": "Describe the accountType of <header> and <footer> tags.",
//                 "instructions": "Record an audio of your explanation."
//               }
//             ]
//           },
//           {
//             "title": "Subtopic 2 - Assessment 2",
//             "questions": [
//               {
//                 "type": "mcq",
//                 "questionText": "Which tag is used for hyperlinks?",
//                 "options": [
//                   "<a>",
//                   "<link>",
//                   "<href>",
//                   "<anchor>"
//                 ],
//                 "correctAnswer": "<a>"
//               }
//             ]
//           }
//         ]
//       }
//     ]
//   }