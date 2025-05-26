
import mongoose, { Schema, model } from 'mongoose';

const courseProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },

  completedTopics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
  completedSubtopics: [{ type: Schema.Types.ObjectId, ref: 'Subtopic' }],
  completedAssignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }],
  completedQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],

  progressPercent: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['not started', 'in progress', 'completed'],
    default: 'not started',
  },

  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export default model('CourseProgress', courseProgressSchema);
