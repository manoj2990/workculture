import { Request, Response } from 'express';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiError from '@/utils/apiError.utils';
import ApiResponse from '@/utils/apiResponse.utils';
import CourseModel from '@/models/course.model';
import assessmentsModel from '@/models/assessments.model';
import QuestionModel from '@/models/question.model';
import { IAssessmentCreation } from '@/types';
import OrganizationModel from '@/models/organization.model';
import TopicModel from '@/models/topic.model';
import SubtopicModel from '@/models/subtopic.model';
import { startSession, Types } from 'mongoose';
import { any } from 'zod';
import { IQuestion, Iassessments } from '@/types';
import { Document } from 'mongoose';
import userAnswerModel from '@/models/userAnswer.model';





// Create Assessmentv--> ye logic intial ass create be kreaga or uska baad kuch or ass add krna hai vo be
export const createCourseAssessments = asyncHandler(async (req: Request, res: Response) => {
    const { courseId, topicId, subtopics } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    // Verify course exists and belongs to admin
    const course = await CourseModel.findOne({
        _id: courseId
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    // Verify topic exists and belongs to course
    const topic = await TopicModel.findOne({
        _id: topicId,
        course: courseId
    });

    if (!topic) {
        throw new ApiError(404, 'Topic not found');
    }

    const session = await startSession();
    let createdAssessments: any[] = [];

    try {
        await session.withTransaction(async () => {
            // Process each subtopic
            for (const subtopicData of subtopics) {
                // Verify subtopic exists and belongs to topic
                const subtopic = await SubtopicModel.findOne({
                    _id: subtopicData.subtopicId,
                    topic: topicId
                });

                if (!subtopic) {
                    throw new ApiError(404, `Subtopic ${subtopicData.order} not belongs to topic ${topicId}`);
                }

                let assessmentOrder = 1;
                // Process each assessment in the subtopic
                for (const assessment of subtopicData.assessments) {
                    console.log("assessment-->", assessment)
                    if(assessment.questions.length === 0){
                        throw new ApiError(400, 'Questions are required');
                    }
                    // First create the assessment
                    const newAssessment = await assessmentsModel.create([{
                        assessments_title: assessment.title,
                        order: assessment.order || assessmentOrder,
                        course: courseId,
                        topic: topicId,
                        subtopic: subtopicData.subtopicId,
                        questions: [] // Initialize empty questions array
                    }], { session });

                    // Then create questions with reference to the assessment
                    const createdQuestions = await Promise.all(
                        assessment.questions.map(async (question:any,index:number) => {
                            return await QuestionModel.create([{
                                assessmentsId: newAssessment[0]._id,
                                questionText: question.questionText,
                                questionType: question.questionType,
                                options: question.options?.map((opt:any) => ({
                                    value: opt.trim(),
                                    label: opt.trim()
                                })),
                                correctAnswers: question.correctAnswer ? [question.correctAnswer] : undefined,
                                sampleAnswer: question.sampleAnswer,
                                instructions: question.instructions,
                                order: question.order || index + 1
                            }], { session });
                        })
                    );

                    // Update the assessment with question references
                    const updatedAssessment : any = await assessmentsModel.findByIdAndUpdate(
                        newAssessment[0]._id,
                        {
                            $set: {
                                questions: createdQuestions.map(q => q[0]._id)
                            }
                        },
                        { new: true, session }
                    );

                    if (!updatedAssessment) {
                        throw new ApiError(500, 'Failed to update assessment');
                    }

                    createdAssessments.push(updatedAssessment);

                    // Update the subtopic with the new assessment ID
                    await SubtopicModel.findByIdAndUpdate(
                        subtopicData.subtopicId,
                        {
                            $push: { assessments: updatedAssessment._id }
                        },
                        { session }
                    );

                    assessmentOrder++;
                }
            }
        });

        // Populate the assessments with their questions for the response
        const populatedAssessments = await assessmentsModel.find({
            _id: { $in: createdAssessments.map(a => a._id) }
        }).populate('questions');

        return new ApiResponse(201, {
            assessments: populatedAssessments?.map((assessment:any) => ({
                _id: assessment._id,
                title: assessment.assessments_title,
                subtopic: assessment.subtopic,
                questions: assessment.questions.map((q:any) => ({
                    _id: q._id,
                    questionText: q.questionText ,
                    questionType: q.questionType,
                    options: q.options,
                    correctAnswers: q.correctAnswers,
                    sampleAnswer: q.sampleAnswer,
                    instructions: q.instructions
                }))
            }))
        }, 'Course assessments created successfully').send(res);

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        session.endSession();
    }
});





// Delete Assessment
export const deleteAssessment = asyncHandler(async (req: Request, res: Response) => {
    const { assessmentId,subtopicId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    const assessment = await assessmentsModel.findOne({
        _id: assessmentId,
        subtopic: subtopicId
    });

    if (!assessment) {
        throw new ApiError(404, 'Assessment not found');
    }


    // Delete all questions first
    await QuestionModel.deleteMany({ assessmentsId: assessmentId });

    await SubtopicModel.updateOne(
        { _id: subtopicId },
        { $pull: { assessments: assessmentId } }
    );

    // Delete the assessment
    await assessmentsModel.findByIdAndDelete(assessmentId);

    return new ApiResponse(200, null, 'Assessment deleted successfully').send(res);
});








//if i create a assigment , definatly have one question in it
//every req main saare q ki id honi chaiye-> other wise jo id nhi hai vo q delete ho jayegi
//c-1 add a new question -> send new q data jo ki without id hoga & old q ids -> done
//c-2 update a question -> send old q id & new q data jo update krwani hai -> done
//c-3 delete a question -> remove q id from array, array contain id of q that are present in that assessment -> done
//c-4 update & add both -> send old q id with data jo update krwani hai & new q data jo add krwani hai -> done

// Update Assessment
export const updateAssessment = asyncHandler(async (req: Request, res: Response) => {
    const { assessmentId } = req.body;
    const { title, order, questions } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    // Verify assessment exists
    const assessment = await assessmentsModel.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(404, 'Assessment not found');
    }

    const session = await startSession();
    try {
        await session.withTransaction(async () => {
            // Update assessment metadata if provided
            if (title || order) {
                const updateFields: any = {};
                if (title) updateFields.assessments_title = title;
                if (order) updateFields.order = order;

                await assessmentsModel.findByIdAndUpdate(
                    assessmentId,
                    { $set: updateFields },
                    { session }
                );
            }

            // Handle questions if provided
            if (questions && Array.isArray(questions)) {
                // Get existing questions
                const existingQuestions = await QuestionModel.find({ assessmentsId: assessmentId }, '_id').session(session);
                const existingQuestionIds = existingQuestions.map(q => q._id.toString());

                // Process each question
                const updatedQuestionIds: string[] = [];
                
                for (const question of questions) {
                    if (question.questionId) {
                        // Update existing question
                        const updatedQuestion = await QuestionModel.findByIdAndUpdate(
                            question.questionId,
                            {
                                $set: {
                                    questionText: question.questionText,
                                    questionType: question.questionType,
                                    options: question.options?.map((opt: any) => ({
                                        value: opt.trim(),
                                        label: opt.trim()
                                    })),
                                    correctAnswers: question.correctAnswer ? [question.correctAnswer] : undefined,
                                    sampleAnswer: question.sampleAnswer,
                                    instructions: question.instructions,
                                    order: question.order
                                }
                            },
                            { new: true, session }
                        );

                        if (updatedQuestion) {
                            updatedQuestionIds.push(updatedQuestion._id.toString());
                        }
                    } else {
                        // Create new question
                        const newQuestion = await QuestionModel.create([{
                            assessmentsId: assessmentId,
                            questionText: question.questionText,
                            questionType: question.questionType,
                            options: question.options?.map((opt: any) => ({
                                value: opt.trim(),
                                label: opt.trim()
                            })),
                            correctAnswers: question.correctAnswer ? [question.correctAnswer] : undefined,
                            sampleAnswer: question.sampleAnswer,
                            instructions: question.instructions,
                            order: question.order
                        }], { session });

                        updatedQuestionIds.push(newQuestion[0]._id.toString());
                    }
                }

                // Delete questions that were removed
                const questionsToDelete = existingQuestionIds.filter(id => !updatedQuestionIds.includes(id));
                if (questionsToDelete.length > 0) {
                    await QuestionModel.deleteMany(
                        { _id: { $in: questionsToDelete } },
                        { session }
                    );
                }

                // Update assessment with new question references
                await assessmentsModel.findByIdAndUpdate(
                    assessmentId,
                    { $set: { questions: updatedQuestionIds } },
                    { session }
                );
            }
        });



        // Fetch updated assessment with populated questions
        const updatedAssessment = await assessmentsModel.findById(assessmentId)
            .populate('questions')
            .lean();

        if (!updatedAssessment) {
            throw new ApiError(500, 'Failed to fetch updated assessment');
        }

        return new ApiResponse(200, {
            assessment: {
                _id: updatedAssessment._id,
                title: updatedAssessment.assessments_title,
                order: updatedAssessment.order,
                questions: updatedAssessment.questions.map((q: any) => ({
                    _id: q._id,
                    questionText: q.questionText,
                    questionType: q.questionType,
                    options: q.options,
                    correctAnswers: q.correctAnswers,
                    sampleAnswer: q.sampleAnswer,
                    instructions: q.instructions,
                    order: q.order
                }))
            }
        }, 'Assessment updated successfully').send(res);

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        session.endSession();
    }
});





//get singleassessment details
export const getAssessmentWithUserAnswers = asyncHandler(async (req: Request, res: Response) => {
    const { assessmentId } = req.body;
    const userId = req.user?._id;

    const assessment = await assessmentsModel.findById(assessmentId).populate('questions');
    if (!assessment) {
        throw new ApiError(404, 'Assessment not found');
    }

    const userAnswers = await userAnswerModel.find({ userId, assessmentId });

    const answersMap: { [key: string]: any } = {};
    userAnswers.forEach((ans:any) => {
        answersMap[ans.questionId.toString()] = ans;
    });

    const questionsWithAnswers = assessment.questions.map((q:any) => ({
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        instructions: q.instructions,
        userAnswer: answersMap[q._id.toString()] ? answersMap[q._id.toString()].answer : null,
        isCorrect: answersMap[q._id.toString()] ? answersMap[q._id.toString()].isCorrect : null
    }));

    return new ApiResponse(200, {
        assessment: {
            _id: assessment._id,
            title: assessment.assessments_title,
            questions: questionsWithAnswers
        }
    }, 'Assessment fetched successfully').send(res);
});











































////--------------------------------------------------------------------

// export const createAssessment = asyncHandler(async (req: Request, res: Response) => {

//     const { subtopicId, questions,courseId,title,order } = req.body ;
//     const adminId = req.user?._id;

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     if (!subtopicId || !questions || !Array.isArray(questions) || questions.length === 0) {
//         throw new ApiError(400, 'Subtopic ID and questions are required');
//     }

//     if(!Types.ObjectId.isValid(subtopicId)){
//         throw new ApiError(400, 'Invalid subtopic ID');
//     }

   

//     // Create questions first
//     const createdQuestions = await Promise.all(questions.map(async (question:any,index:number) => {
//         return await QuestionModel.create({
//             questionText: question.questionText.trim(),
//             questionType: question.questionType,
//             options: question.options?.map((opt:any) => ({
//                 value: opt.value.trim(),
//                 label: opt.label.trim()
//             })),
//             correctAnswers: question.correctAnswers,
//             sampleAnswer: question.sampleAnswer?.trim(),
//             instructions: question.instructions?.trim(),
//             order: question.order || index + 1
//         });
//     }));

//     // Create assessment with question references
//     const newAssessment = await assessmentsModel.create({
//         assessments_title: title,
//         subtopic: subtopicId,
//         course: courseId,
//         order: order,
//         questions: createdQuestions.map(q => q._id)
//     });

//     return new ApiResponse(201, {
//         assessment: {
//             _id: newAssessment._id,
//             assessments_title: newAssessment.assessments_title,
//             course: newAssessment.course,
//             subtopic: newAssessment.subtopic,
//             order: newAssessment.order,
//             questions: createdQuestions.map(q => ({
//                 _id: q._id,
//                 questionText: q.questionText,
//                 questionType: q.questionType,
//                 options: q.options,
//                 correctAnswers: q.correctAnswers,
//                 sampleAnswer: q.sampleAnswer,
//                 instructions: q.instructions
//             }))
//         }
//     }, 'Assessment created successfully').send(res);
// });



























// // Get Assessment Details
// export const getAssessmentDetails = asyncHandler(async (req: Request, res: Response) => {
//     const { assessmentId } = req.params;
//     const adminId = req.user?._id;

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     const assessment = await assessmentsModel.findOne({
//         _id: assessmentId,
//         course: { 
//             $in: await CourseModel.find({
//                 'linked_entities.organization': { 
//                     $in: await OrganizationModel.find({ admin: adminId }).distinct('_id') 
//                 }
//             }).distinct('_id')
//         }
//     }).populate('questions');

//     if (!assessment) {
//         throw new ApiError(404, 'Assessment not found');
//     }

//     return new ApiResponse(200, {
//         assessment: {
//             _id: assessment._id,
//             course: assessment.course,
//             subtopic: assessment.subtopic,
//             questions: assessment.questions.map(q => ({
//                 _id: q._id,
//                 questionText: q.questionText,
//                 questionType: q.questionType,
//                 options: q.options,
//                 correctAnswers: q.correctAnswers,
//                 sampleAnswer: q.sampleAnswer,
//                 instructions: q.instructions
//             }))
//         }
//     }, 'Assessment details fetched successfully').send(res);
// });




// interface IAssessmentInput {
//     courseId: string;
//     topicId: string;
//     subtopics: {
//         subtopicId: string;
//         assessments: {
//             title: string;
//             questions: {
//                 questionType: 'multiple_choice' | 'descriptive' | 'video' | 'audio';
//                 questionText: string;
//                 options?: string[];
//                 correctAnswer?: string;
//                 sampleAnswer?: string;
//                 instructions?: string;
//             }[];
//         }[];
//     }[];
// }





 








//////////////////
// export const createCourseAssessments = asyncHandler(async (req: Request, res: Response) => {
//     const { courseId, topicId, subtopics } = req.body as IAssessmentInput;
//     const adminId = req.user?._id;

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     const course = await CourseModel.findOne({ _id: courseId });
//     if (!course) {
//         throw new ApiError(404, 'Course not found');
//     }

//     const topic = await TopicModel.findOne({ _id: topicId, course: courseId });
//     if (!topic) {
//         throw new ApiError(404, 'Topic not found');
//     }

//     const session = await startSession();
//     let createdAssessments: any[] = [];
//     const errors: { subtopicId: string; assessmentTitle: string; message: string }[] = [];

//     try {
//         await session.withTransaction(async () => {
//             for (const subtopicData of subtopics) {
//                 const subtopic = await SubtopicModel.findOne({ _id: subtopicData.subtopicId, topic: topicId });
//                 if (!subtopic) {
//                     errors.push({
//                         subtopicId: subtopicData.subtopicId,
//                         assessmentTitle: '',
//                         message: `Subtopic ${subtopicData.subtopicId} not found`
//                     });
//                     continue;
//                 }

//                 for (const assessment of subtopicData.assessments) {
//                     try {
//                         // Create the assessment
//                         const newAssessment = await assessmentsModel.create([{
//                             assessments_title: assessment.title,
//                             course: courseId,
//                             topic: topicId,
//                             subtopic: subtopicData.subtopicId,
//                             questions: []
//                         }], { session });

//                         // Prepare questions and bulk insert
//                         const questionsToInsert = assessment.questions.map((question) => ({
//                             assessmentsId: newAssessment[0]._id,
//                             questionText: question.questionText,
//                             questionType: question.questionType,
//                             options: question.options?.map(opt => ({ value: opt.trim(), label: opt.trim() })),
//                             correctAnswers: question.correctAnswer ? [question.correctAnswer] : undefined,
//                             sampleAnswer: question.sampleAnswer,
//                             instructions: question.instructions
//                         }));

//                         const createdQuestions = await QuestionModel.insertMany(questionsToInsert, { session });

//                         // Link questions to assessment
//                         const updatedAssessment = await assessmentsModel.findByIdAndUpdate(
//                             newAssessment[0]._id,
//                             { $set: { questions: createdQuestions.map(q => q._id) } },
//                             { new: true, session }
//                         );

//                         if (updatedAssessment) {
//                             createdAssessments.push(updatedAssessment);

//                             // Update subtopic with assessment ID
//                             await SubtopicModel.findByIdAndUpdate(
//                                 subtopicData.subtopicId,
//                                 { $push: { assessments: updatedAssessment._id } },
//                                 { session }
//                             );
//                         } else {
//                             errors.push({
//                                 subtopicId: subtopicData.subtopicId,
//                                 assessmentTitle: assessment.title,
//                                 message: 'Failed to update assessment with questions'
//                             });
//                         }
//                     } catch (err: any) {
//                         errors.push({
//                             subtopicId: subtopicData.subtopicId,
//                             assessmentTitle: assessment.title,
//                             message: err.message || 'Failed to create assessment or questions'
//                         });
//                     }
//                 }
//             }
//         });

//         // Populate the assessments with their questions for the response
//         const populatedAssessments = await assessmentsModel.find({
//             _id: { $in: createdAssessments.map(a => a._id) }
//         }).populate<{ questions: IQuestion[] }>('questions');

//         return new ApiResponse(201, {
//             success: true,
//             assessments: populatedAssessments.map(assessment => ({
//                 _id: assessment._id,
//                 title: assessment.assessments_title,
//                 course: assessment.course,
//                 subtopic: assessment.subtopic,
//                 questions: assessment.questions.map(q => ({
//                     _id: q._id,
//                     questionText: q.questionText,
//                     questionType: q.questionType,
//                     options: q.options,
//                     correctAnswers: q.correctAnswers,
//                     sampleAnswer: q.sampleAnswer,
//                     instructions: q.instructions
//                 }))
//             })),
//             errors // return partial errors to frontend
//         }, 'Course assessments processed successfully').send(res);

//     } catch (error) {
//         if (session.inTransaction()) {
//             await session.abortTransaction();
//         }
//         throw error;
//     } finally {
//         session.endSession();
//     }
// });
