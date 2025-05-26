
import CourseProgressModel from '../models/courseProgress.model';
import CourseModel from '../models/course.model';
import asyncHandler from '@/utils/asyncHandler.utils';
import { Request, Response } from 'express';
import TopicModel from '../models/topic.model';
import ApiResponse from '@/utils/apiResponse.utils';
import CourseSummaryService from '@/services/CourseSummary.service';
  import { ITopic, ISubtopic } from '@/types/course.types';



//update course progress of employee
export const updateProgress = asyncHandler(async (req: Request, res: Response) => {

  const {  courseId, topicId, subtopicId, assessmentsId, questionId } = req.body;
  const userId = req.user?._id
  let progress = await CourseProgressModel.findOne({ userId, courseId });

  if (!progress) { //agar progress nahi hai toh create kro
    progress = new CourseProgressModel({ userId, courseId });
  }

  if (topicId && !progress.completedTopics.includes(topicId)) {
    progress.completedTopics.push(topicId);
  }

  if (subtopicId && !progress.completedSubtopics.includes(subtopicId)) {
    progress.completedSubtopics.push(subtopicId);
  }
  if (assessmentsId && !progress.completedAssignments.includes(assessmentsId)) {
    progress.completedAssignments.push(assessmentsId);
  }
  if (questionId && !progress.completedQuestions.includes(questionId)) {
    progress.completedQuestions.push(questionId);
  }

  const course = await CourseModel.findById(courseId);

  const totals = {
    totalTopics: course?.topics.length,
    totalSubtopics: course?.topics.reduce((acc, topic) => acc + (topic as unknown as ITopic).subtopics?.length, 0),
    totalAssignments: course?.topics.reduce((acc, topic) => acc + (topic as unknown as ITopic).subtopics?.reduce((subAcc: any, subtopic: any) => subAcc + (subtopic as unknown as ISubtopic).assessments.length, 0), 0),
    totalQuestions: course?.topics.reduce((acc, topic) => acc + (topic as unknown as ITopic).subtopics?.reduce((subAcc: any, subtopic: any) => subAcc + (subtopic as unknown as ISubtopic).assessments.length, 0), 0),
  };

  // const weights = {
  //   topicWeight: 0.3,
  //   subtopicWeight: 0.2,
  //   assignmentWeight: 0.3,
  //   questionWeight: 0.2,
  // };

  const weights = {
    topicWeight: 0.1,
    subtopicWeight: 0.1,
    assignmentWeight: 0.1,
    questionWeight: 0.7,
  };

  progress.progressPercent = await CourseSummaryService.calculateWeightedProgress(progress, totals, weights);
  progress.status = progress.progressPercent === 100 ? 'completed' : 'in progress';

  progress.lastUpdated = new Date();
  await progress.save();

  return new ApiResponse(200, {
    message: 'Progress updated',
    progress
  }).send(res);


});










