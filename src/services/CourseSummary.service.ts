import CourseProgressModel from "@/models/courseProgress.model";
import CourseModel from "@/models/course.model";
import ApiError from "@/utils/apiError.utils";
import departmentModel from "@/models/department.model";
import userModel from "@/models/user.model";
import { Schema } from "mongoose";

interface EmployeeMapData {
  name: string;
  completed: number;
  inProgress: number;
}

interface EmployeeMap {
  [key: string]: EmployeeMapData;
}

class CourseSummaryService {
  // Admin: get course summary
  async getCourseSummaryForAdmin(courseId: string) {

    const course = await CourseModel.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found');
    }

    const progresses = await CourseProgressModel.find({ courseId });

    const totalUsers = progresses.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let totalPercent = 0;

    progresses.forEach(p => {
      totalPercent += p.progressPercent;
      if (p.status === 'completed') completed++;
      else if (p.status === 'in progress') inProgress++;
      else if (p.status === 'not started') notStarted++;
    });

    const averageProgress = totalUsers ? Math.round(totalPercent / totalUsers) : 0;

    return {
      totalUsers,
      completed,
      completedPercentage: Math.round((completed / totalUsers) * 100),
      inProgress,
      notStarted,
      averageProgress

    };
  }





  // Employee: get their course progress
  async getEmployeeCourseProgress(userId: string, courseId: string) {

    const progress = await CourseProgressModel.findOne({ userId, courseId });

    if (!progress) {
      throw new ApiError(404, 'Progress not found');
    }

    return {
      progress
    };
  }



//calculate weighted progress--> to store in course progress model
  async calculateWeightedProgress(progress: any, totals: any, weights: any) {

    const topicPercent : number = totals.totalTopics
    ? progress.completedTopics.length / totals.totalTopics
    : 0;

    const subtopicPercent: number = totals.totalSubtopics
      ? progress.completedSubtopics.length / totals.totalSubtopics
      : 0;

    const assignmentPercent: number = totals.totalAssignments
      ? progress.completedAssignments.length / totals.totalAssignments
      : 0;

    const questionPercent: number = totals.totalQuestions
      ? progress.completedQuestions.length / totals.totalQuestions
      : 0;

  const weightedProgress =
    topicPercent * weights.topicWeight +
    subtopicPercent * weights.subtopicWeight +
    assignmentPercent * weights.assignmentWeight +
    questionPercent * weights.questionWeight;

  return Math.round(weightedProgress * 100);

}



//Department-level course status summary
async getDepartmentCourseStatus(departmentId: string) {
  const employees = await userModel.find({
    'employeeData.department': departmentId,
    accountType: 'employee'
  });

  const employeeIds: Schema.Types.ObjectId[] = employees.map(emp => emp._id);

  const statusCounts = await CourseProgressModel.aggregate([
    { $match: { userId: { $in: employeeIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const result = {
    completed: 0,
    inProgress: 0,
    courseProgressPercentage: 0
  };

  statusCounts.forEach(item => {
    if (item._id === 'completed') result.completed = item.count;
    if (item._id === 'in_progress') result.inProgress = item.count;
  });

  const totalEmp = employees.length;

  // Get unique users who completed at least one course
  const completedUsers = await CourseProgressModel.distinct('userId', {
    userId: { $in: employeeIds },
    status: 'completed'
  });

  result.courseProgressPercentage = totalEmp === 0 
    ? 0 
    : Math.round((completedUsers.length / totalEmp) * 100);

  return result;
}



//emp level course status summary
async getDepartmentMembersCourseStatus(departmentId: string) {
  const employees = await userModel.find({
    'employeeData.department': departmentId,
    accountType: 'employee'
  });

  const employeeIds: Schema.Types.ObjectId[] = employees.map(emp => emp._id);

  // Aggregate course status per user
  const memberStatus = await CourseProgressModel.aggregate([
    { $match: { userId: { $in: employeeIds } } },
    {
      $group: {
        _id: { userId: "$userId", status: "$status" },
        count: { $sum: 1 }
      }
    }
  ]);

  // Prepare employee-level map
  const employeeMap: EmployeeMap = {};

  employees.forEach((emp) => {
    employeeMap[emp._id.toString()] = {
      name: emp.name,
      completed: 0,
      inProgress: 0
    };
  });

  // Fill counts
  memberStatus.forEach(item => {
    const userId = item._id.userId.toString();
    const status = item._id.status;

    if (employeeMap[userId]) {
      if (status === 'completed') employeeMap[userId].completed = item.count;
      if (status === 'in_progress') employeeMap[userId].inProgress = item.count;
    }
  });

  // Return as array (easy for frontend)
  const result = Object.entries(employeeMap).map(([userId, data]) => ({
    userId,
    name: data.name,
    completed: data.completed,
    inProgress: data.inProgress
  }));

  return result;
}




// Get course progress for all employees in an organization
async getOrganizationMembersCourseStatus(organizationId: string) {
  const employees = await userModel.find({
    'employeeData.organization': organizationId,
    accountType: 'employee'
  });

  const employeeIds: Schema.Types.ObjectId[] = employees.map(emp => emp._id);

  // Aggregate course status per user
  const memberStatus = await CourseProgressModel.aggregate([
    { $match: { userId: { $in: employeeIds } } },
    {
      $group: {
        _id: { userId: "$userId", status: "$status" },
        count: { $sum: 1 }
      }
    }
  ]);

  // Prepare employee-level map
  const employeeMap: EmployeeMap = {};

  employees.forEach((emp) => {
    employeeMap[emp._id.toString()] = {
      name: emp.name,
      completed: 0,
      inProgress: 0
    };
  });

  // Fill counts
  memberStatus.forEach(item => {
    const userId = item._id.userId.toString();
    const status = item._id.status;

    if (employeeMap[userId]) {
      if (status === 'completed') employeeMap[userId].completed = item.count;
      if (status === 'in_progress') employeeMap[userId].inProgress = item.count;
    }
  });

  // Return as array (easy for frontend)
  const result = Object.entries(employeeMap).map(([userId, data]) => ({
    userId,
    name: data.name,
    completed: data.completed,
    inProgress: data.inProgress
  }));

  return result;
}








async getCourseProgressUnderDepartment(departmentId: string) {
  const department = await departmentModel.findById(departmentId).populate('courses');

  if (!department) throw new Error('Department not found');

  const courseIds = department.courses.map((c: any) => c._id);

  const progressSummary = await CourseProgressModel.aggregate([
      {
          $match: {
              courseId: { $in: courseIds }
          }
      },
      {
          $group: {
              _id: '$courseId',
              avgProgress: { $avg: '$progressPercent' },
              totalLearners: { $sum: 1 },
              completedCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              inProgressCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'in progress'] }, 1, 0] }
              },
              notStartedCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'not started'] }, 1, 0] }
              }
          }
      }
  ]);

  return progressSummary;
}










}

export default new CourseSummaryService();
