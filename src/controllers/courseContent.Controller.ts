import { Request, Response } from 'express';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiError from '@/utils/apiError.utils';
import ApiResponse from '@/utils/apiResponse.utils';
import CourseModel from '@/models/course.model';
import TopicModel from '@/models/topic.model';
import SubtopicModel from '@/models/subtopic.model';

import fs from 'fs';

import mongoose, { startSession, Types } from 'mongoose';
import AssessmentModel from '../models/assessments.model';
import QuestionModel from '../models/question.model';

  

import { deleteFromCloudinary, uploadOnCloudinary } from '@/utils/cloudinary.utils';
import { cleanUpUploads, uploadFiles } from '@/utils/fileUploadHandler';
import { hasUncaughtExceptionCaptureCallback } from 'process';
import { doesNotMatch } from 'assert';
import { any } from 'zod';
import {textToSpeech} from '@/utils/azureTTS'
import { buffer } from 'stream/consumers';



//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> topic related controllers>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//create toic
export const createTopic = asyncHandler(async (req: Request, res: Response) => {
    const { title, description, order, courseId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!Types.ObjectId.isValid(courseId)) {
        throw new ApiError(400, 'Invalid course ID');
    }


    const course = await CourseModel.findById(courseId);

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }
    
    
    const topic = await TopicModel.create({
        title,
        description,
        order,
        course: courseId
    });


    if(!topic){
        throw new ApiError(500, 'Failed to create topic');
    }

    console.log("topic data--->", topic)
  const updatedCourse = await CourseModel.findByIdAndUpdate(
    courseId,
    { $push: { topics: topic._id } },
    { new: true }
  ).populate('topics').lean().exec();

  if(!updatedCourse){
    throw new ApiError(500, 'Failed to update course');
  }
  
  
  const topiData={
    id:topic._id,
    courseId:topic.course,
    title:topic.title,
    description:topic.description
  }
    return new ApiResponse(201, {
        ...topiData
    }, 'Topic created successfully').send(res);
    
});



//update topic
export const updateTopic = asyncHandler(async (req: Request, res: Response) => {

    const { title, description, order, topicId , courseId} = req.body;
    const adminId = req.user?._id;

    

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!Types.ObjectId.isValid(courseId)) {
        throw new ApiError(400, 'Invalid course ID');
    }

    if (!Types.ObjectId.isValid(topicId)) {
        throw new ApiError(400, 'Invalid topic ID');
    }
    
    const course = await CourseModel.findById(courseId);

    if(!course){
        throw new ApiError(404, 'Course not found');
    }

    if(!course.topics.includes(topicId)){
        throw new ApiError(400, 'Topic does not belong to this course');
    }

    const topic = await TopicModel.findByIdAndUpdate(topicId, {
        title: title.trim(),
        description: description?.trim(),
        order: order
        },
     { new: true }
    ).lean().exec();

    if(!topic){
        throw new ApiError(404, 'Failed to update topic');
    }

   
    // const updatedCourse = await CourseModel.findByIdAndUpdate(
    //     courseId,
    //     { $pull: { topics: topicId } },
    //     { new: true }
    // ).populate('topics').lean().exec();

    // if(!updatedCourse){
    //     throw new ApiError(500, 'Failed to update course');
    // }

console.log("updated topic--->", topic)
    return new ApiResponse(200, {
        ...topic
    }, 'Topic updated successfully').send(res);
    
    
 });

    


// Delete Topic
export const deleteTopic = asyncHandler(async (req: Request, res: Response) => {
    const { topicId, courseId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!Types.ObjectId.isValid(topicId) || !Types.ObjectId.isValid(courseId)) {
        throw new ApiError(400, 'Invalid topic or course ID');
    }

    const topic = await TopicModel.findById(topicId);
    if (!topic) {
        throw new ApiError(404, 'Topic not found');
    }

    if (topic.course.toString() !== courseId) {
        throw new ApiError(400, 'Topic does not belong to this course');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find all subtopics with their content details
        const subtopics = await SubtopicModel.find({ topic: topicId }).session(session);
        const subtopicIds = subtopics.map((subtopic) => subtopic._id);

        if (subtopicIds.length > 0) {
            // Clean up Cloudinary resources for each subtopic
            for (const subtopic of subtopics) {
                if (subtopic.contentType === 'video' && subtopic.video?.public_id) {
                    await deleteFromCloudinary(subtopic.video.public_id);
                } else if (subtopic.contentType === 'file' && subtopic.files?.length) {
                    await Promise.all(subtopic.files.map(async (file) => {
                        if (file.public_id) {
                            await deleteFromCloudinary(file.public_id);
                        }
                    }));
                }
            }
            
            const assessments = await AssessmentModel.find({ subtopic: { $in: subtopicIds } }, '_id').session(session);
            const assessmentIds = assessments.map((assessment) => assessment._id);

            if (assessmentIds.length > 0) {
                
                await QuestionModel.deleteMany({ assessmentsId: { $in: assessmentIds } }, { session });

                await AssessmentModel.deleteMany({ _id: { $in: assessmentIds } }, { session });
            }

            await SubtopicModel.deleteMany({ _id: { $in: subtopicIds } }, { session });
        }

        await CourseModel.findByIdAndUpdate(courseId, { $pull: { topics: topicId } }, { session });

        await TopicModel.findByIdAndDelete(topicId).session(session);

        await session.commitTransaction();
        return new ApiResponse(200, null, 'Topic deleted successfully').send(res);

    } catch (error) {
        console.error('Delete Topic Error:', error);
        await session.abortTransaction();
        throw new ApiError(500, 'Error deleting topic and related data');
    } finally {
        await session.endSession();
    }
});







//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>subtopic related controllers   >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


//need to check --> file wali error
// export const createSubtopic = asyncHandler(async (req: Request, res: Response) => {
//     console.log("entring into controller------------>")
//     let uploded_file_public_id : any= [];
//     try {
//         const { topicId, courseId } = req.body;
//         const adminId = req.user?._id;

//         if (!adminId) {
//             throw new ApiError(401, 'Unauthorized access');
//         }

//         if (!Types.ObjectId.isValid(topicId) || !Types.ObjectId.isValid(courseId)) {
//             throw new ApiError(400, 'Invalid topic or course ID');
//         }

//         const topic = await TopicModel.findById(topicId);
//         if (!topic) {
//             throw new ApiError(404, 'Topic not found');
//         }

//         if (topic.course.toString() !== courseId) {
//             throw new ApiError(400, 'Topic does not belong to this course');
//         }

       
//         const validatedData = req.body;
//         console.log("req.body", req.body)
//         console.log("📦 Validated data:", validatedData);
//         // console.log("req.body.image", req.body.image)
//         console.log("req.files", req?.files)
       
        
//         let uploadResult;
//         if (req.files && req.files.length !== 0) {
//             console.log("--> entring to save video")
//             // ,validatedData.videoName
//             // validatedData.files
//             uploadResult = await uploadFiles(req.files as any[], validatedData.contentType,validatedData.filenames);
//             uploded_file_public_id  = uploadResult?.publicIds;
//             console.log("uploadResult-->",uploadResult)
//             Object.assign(validatedData, uploadResult?.uploadedFiles);
//         }

//         if(validatedData.contentType === 'link'){
//             let linksArray:any[] = [];
//             if (validatedData.links) {
//                 if (Array.isArray(validatedData.links)) {
//                     linksArray = validatedData.links;
//                 } else if (typeof validatedData.links === 'string') {
//                     try {
//                         linksArray = JSON.parse(validatedData.links);   
//                     } catch (error) {
//                         console.error("Failed to parse 'links' from body", error);
//                         throw new ApiError(400, 'Invalid links format');
//                     }
//                 } else {
//                     throw new ApiError(400, 'Invalid links format');
//                 }
//             }
//             validatedData.links = linksArray;
//         }

//         if(validatedData.contentType === 'video' && validatedData.videoUrl){
//             console.log("--> user provided video url")
//            validatedData.video = {
//             name: validatedData.videoName,
//             url: validatedData.videoUrl,
//             public_id: undefined
//            }
//         }

        
//         const subtopic = new SubtopicModel({
//             topic: topicId,
//             title: validatedData.title,
//             description: validatedData.description,
//             order: validatedData.order,
//             contentType: validatedData.contentType,
//             text_content: validatedData.text_content || undefined,
//             imageUrl: validatedData.contentType === 'text' ? validatedData.image : undefined,
//             video: validatedData.contentType === 'video' ? validatedData.video : undefined, 
//             files: validatedData.contentType === 'file' ? validatedData.files : undefined,
//             links: validatedData.contentType === 'link' ? validatedData.links : undefined,
//         });

//         await subtopic.save();

        

//         if (!subtopic) {
//             throw new ApiError(500, 'Failed to create subtopic');
//         }

//         const updatedTopic = await TopicModel.findByIdAndUpdate(
//             validatedData.topicId,
//             { $push: { subtopics: subtopic._id } },
//             { new: true }
//         ).populate('subtopics').lean().exec();

       

//         if (!updatedTopic) {
//             throw new ApiError(500, 'Failed to update topic');
//         }

//         return new ApiResponse(201, {
//             ...updatedTopic
//         }, 'Subtopic created successfully').send(res);

//     } catch (error: any) {
//         console.error('Error creating subtopic:', error);

//         await cleanUpUploads(uploded_file_public_id, req.files as any[]);
        
//         throw new ApiError(
//             error.statusCode || 500,
//             error.message || 'Failed to create subtopic'
//         );
//     }
// });



export const createSubtopic = asyncHandler(async (req: Request, res: Response) => {
    console.log("entering into controller------------>");
    let uploaded_file_public_id: string[] = [];
    try {
      const { topicId, courseId } = req.body;
      const adminId = req.user?._id;
  
      if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
      }
  
      if (!Types.ObjectId.isValid(topicId) || !Types.ObjectId.isValid(courseId)) {
        throw new ApiError(400, 'Invalid topic or course ID');
      }
  
      const topic = await TopicModel.findById(topicId);
      if (!topic) {
        throw new ApiError(404, 'Topic not found');
      }
  
      if (topic.course.toString() !== courseId) {
        throw new ApiError(400, 'Topic does not belong to this course');
      }
  
      const validatedData = req.body;
      console.log("req.body", req.body);
      console.log("req.files", req?.files);
      const filenames = validatedData.filenames || []; // Use validatedData.filenames safely
      let uploadResult;
      if (req.files && req.files.length !== 0) {
        console.log("--> entering to save files");
        uploadResult = await uploadFiles(req.files as any[], validatedData.contentType, validatedData.videoName, filenames);
        uploaded_file_public_id = uploadResult?.publicIds || [];
        console.log("uploadResult-->", uploadResult);
  
        let videoData;
        // Update validatedData based on contentType
        if (validatedData.contentType === 'file' && uploadResult?.uploadedFiles.files) {
          validatedData.files = uploadResult.uploadedFiles.files; // Replace with uploaded files
        } else if (validatedData.contentType === 'text' && uploadResult?.uploadedFiles.image) {
          validatedData.image = uploadResult.uploadedFiles.image; // Optionally store full image object
        }
        else if (validatedData.contentType === 'video') {
            validatedData.video = uploadResult?.uploadedFiles.video; // Optionally store full image object
          }
      }
  
      if (validatedData.contentType === 'link') {
        let linksArray: any[] = [];
        if (validatedData.links) {
          if (Array.isArray(validatedData.links)) {
            linksArray = validatedData.links;
          } else if (typeof validatedData.links === 'string') {
            try {
              linksArray = JSON.parse(validatedData.links);
            } catch (error) {
              console.error("Failed to parse 'links' from body", error);
              throw new ApiError(400, 'Invalid links format');
            }
          } else {
            throw new ApiError(400, 'Invalid links format');
          }
        }
        validatedData.links = linksArray;
      }
  
      if (validatedData.contentType === 'video' && validatedData.videoUrl) {
        console.log("--> user provided video url");
        validatedData.video = {
          name: validatedData.videoName,
          url: validatedData.videoUrl,
          public_id: undefined,
        };
      }

      let audioUrl;
      if (validatedData.contentType === 'text' && validatedData.text_content) {
        console.log("entring to convert text --> speech")
        // Generate audio using Azure TTS
        const audioBuffer = await textToSpeech(validatedData.text_content, { outputFormat: 'buffer' }) as Buffer | null;
        if (!audioBuffer) {
          throw new ApiError(500, 'Failed to generate audio');
        }
  
        // Upload audio to Cloudinary
        const uploadResult = await uploadOnCloudinary(audioBuffer, 'audio');
        audioUrl = {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
        };
        uploaded_file_public_id.push(uploadResult.public_id);
        console.log("audioUrl---->",audioUrl)
        console.log("existing------->")
      }
  
      console.log("final validatedData -->", validatedData);
  
      const subtopic = new SubtopicModel({
        topic: topicId,
        title: validatedData.title,
        description: validatedData.description,
        order: validatedData.order,
        contentType: validatedData.contentType,
        text_content: validatedData.contentType === 'text' ? validatedData.text_content : undefined,
        audioUrl: validatedData.contentType === 'text' ? audioUrl : undefined,
        imageUrl: validatedData.contentType === 'text' ? validatedData.image : undefined,
        video: validatedData.contentType === 'video' ? validatedData.video : undefined,
        files: validatedData.contentType === 'file' ? validatedData.files : undefined,
        links: validatedData.contentType === 'link' ? validatedData.links : undefined,
      });
  
      await subtopic.save();
  
      if (!subtopic) {
        throw new ApiError(500, 'Failed to create subtopic');
      }
  
      const updatedTopic = await TopicModel.findByIdAndUpdate(
        validatedData.topicId,
        { $push: { subtopics: subtopic._id } },
        { new: true }
      )
        .populate('subtopics')
        .lean()
        .exec();
  
      if (!updatedTopic) {
        throw new ApiError(500, 'Failed to update topic');
      }

      
  
    //   const data = {
    //     id: subtopic.topic,
    //     title: subtopic.title,
    //     description: subtopic.description,
    //     contentType: subtopic.contentType,
    //     text_content: subtopic.text_content,
    //     image: subtopic.imageUrl,
    //     video: subtopic.video,
    //     videoUrl: subtopic.videoUrl,
    //     filenames: subtopic.filenames,
    //     links: subtopic.links,
    //   },


    const lastItem = updatedTopic.subtopics[updatedTopic.subtopics.length - 1];
      console.log("lastItem---->",lastItem)
      return new ApiResponse(201, { ...updatedTopic }, 'Subtopic created successfully').send(res);
    } catch (error: any) {
      console.error('Error creating subtopic:', error);
  
      await cleanUpUploads(uploaded_file_public_id, req.files as any[]);
  
      throw new ApiError(error.statusCode || 500, error.message || 'Failed to create subtopic');
    }
  });





// Helper function to validate content type specific fields
const validateContentTypeFields = (contentType: string, data: any) => {
    console.log("--> validating content type fields")
    console.log("contentType", contentType)
    console.log("data", data)
    switch (contentType) {
        case 'text':
            console.log("--> validating text content")
            if (!data.text_content) {
                throw new ApiError(400, 'Text content is required for text type');
            }
            break;
        case 'video':
            console.log("--> validating video content")
            console.log("data.videoUrl", data.videoUrl)
            console.log("data.videoFile", data.files[0])
            if (!data.videoUrl && !data.files[0]) {
                throw new ApiError(400, 'Either video URL or file is required for video type');
            }
            break;
        case 'file':
            console.log("--> validating file content")
            if (!data.files || data.files.length === 0) {
                throw new ApiError(400, 'At least one file is required for file type');
            }
            break;
        case 'link':
            console.log("--> validating link content")
            if (!data.links || data.links.length === 0) {
                throw new ApiError(400, 'At least one link is required for link type');
            }
            break;
    }
};



// Helper function to clean up old content
const cleanupOldContent = async (existingSubtopic: any) => {
    console.log("--> cleaning up old content")
    console.log("existingSubtopic", existingSubtopic)
    switch (existingSubtopic.contentType) {
        case 'video':
            if (existingSubtopic.video?.public_id) {
                console.log("--> deleting old video")
                console.log("existingSubtopic.video.public_id", existingSubtopic.video.public_id)
               const r = await deleteFromCloudinary(existingSubtopic.video.public_id);
               console.log("cleanupOld videoContent -->", r)
            }
            break;
        case 'file':
            if (existingSubtopic.files?.length) {
                await Promise.all(existingSubtopic.files.map(async (file: any) => {
                    if (file.public_id) {
                        console.log("--> deleting old file")
                        console.log("file.public_id", file.public_id)
                        const r = await deleteFromCloudinary(file.public_id);
                        console.log("cleanupOld fileContent -->", r)
                    }
                }));
            }
            case 'text':
                if (existingSubtopic.audioUrl) {
                    const r = await deleteFromCloudinary(existingSubtopic.audioUrl.public_id);
                    console.log("cleanupOld fileContent -->", r)
                    // await Promise.all(existingSubtopic.files.map(async (file: any) => {
                    //     if (file.public_id) {
                    //         console.log("--> deleting old file")
                    //         console.log("file.public_id", file.public_id)
                    //         const r = await deleteFromCloudinary(file.public_id);
                    //         console.log("cleanupOld fileContent -->", r)
                    //     }
                    // }));
                }
            break;
    }
};



// Helper function to handle video update
const handleVideoUpdate = async (videoUrl: string, videoFile: any, videoName: string, existingVideo: any) => {
    console.log("--> handling video update")
    console.log("videoUrl", videoUrl)
    console.log("videoFile", videoFile)
    console.log("videoName", videoName)
    console.log("existingVideo", existingVideo)
    // Clean up old video if it exists
    if (existingVideo?.public_id) {
        console.log("--> deleting old video")
        console.log("existingVideo.public_id", existingVideo.public_id)
        const r= await deleteFromCloudinary(existingVideo.public_id);
        console.log("r", r)
    }

    if (videoUrl) {
        return {
            name: videoName,
            url: videoUrl,
            public_id: undefined,
        };
    } else if (videoFile) {
        const videoUploadResult = await uploadOnCloudinary(videoFile.path, 'video');
        fs.unlinkSync(videoFile.path);
        return {
            name: videoName,
            url: videoUploadResult.url,
            public_id: videoUploadResult.public_id,
        };
    }
    return undefined;
};



// Helper function to handle files update
const handleFilesUpdate = async (files: any[], fileNames: any[], existingFiles: any[]) => {
    console.log("--> handling files update")
    console.log("files", files)
    console.log("fileNames", fileNames)
    console.log("existingFiles", existingFiles)
    const filesData: any[] = [];
    const publicIds: string[] = [];

    // Clean up old files if they exist
    if (existingFiles?.length) {
        await Promise.all(existingFiles.map(async (file) => {
            console.log("--> deleting old files")
            console.log("file", file)
            if (file.public_id) {
                await deleteFromCloudinary(file.public_id);
            }
        }));
    }




    // Upload new files
    await Promise.all(files.map(async (file: any, index: number) => {
        console.log("--> uploading new files")
        console.log("file", file)
        const result = await uploadOnCloudinary(file.path, 'file');
        publicIds.push(result?.public_id);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

        filesData.push({
            name: fileNames[index]?.name || file.originalname,
            url: result?.url,
            public_id: result?.public_id,
            type: file.mimetype
        });
    }));

    console.log("filesData -->", filesData)
    console.log("publicIds -->", publicIds)

    return { filesData, publicIds };
};






// 1. sirf title/dec/order change kr pa rha
// 2. contentType = same , undar ke Content
// text -> does
// video file -> done , videoUrl -> done *****old files delete nhi ho rhi
// files -> done , old files delete ho rhi hai , aur new file coreect name ke sath aa rhi hai
// links -> done , old links delete ho rhi hai , aur new links aa rhi hai

// 3. change validateContentType 
// file -> video --> done
//video -> file --> done
//link -> text --> done
//text -> link --> done


//need some changes according to new change---> just need to checck resources deletion part
export const updateSubtopic = asyncHandler(async (req: Request, res: Response) => {
    const {
        topicId,
        subtopicId,
        title,
        description,
        // order,
        contentType,
        videoUrl,
        files: fileNames,
        links,
        videoName,
        text_content
    } = req.body;

    


    const adminId = req.user?._id;
    const uploadedFiles = req.files as Express.Multer.File[];
    console.log("entring into update subtopic controller---->")
    console.log("req.body", req.body)
    console.log("req.files", req.files)
    // console.log("req.files.video", req.files?.video)
    // console.log("req.files.files", req.files?.files)
    console.log("uploadedFiles", uploadedFiles[0])
    console.log("req.body.video", req.body.video)
    console.log("req.body.files", req.body.files)


    // Input validation
    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if(!Types.ObjectId.isValid(topicId)){
        throw new ApiError(400, 'Invalid topic ID');
    }

    if (!Types.ObjectId.isValid(subtopicId)) {
        throw new ApiError(400, 'Invalid subtopic ID');
    }

    console.log("contentType", contentType)
    if(contentType){
        console.log("--> validating content type fields")
        console.log("new contentType", contentType)
        validateContentTypeFields(contentType, { text_content,videoUrl, files: uploadedFiles, links });
    }


    const session = await startSession();
    let updatedSubtopic;

    try {
        await session.withTransaction(async () => {
            const existingSubtopic = await SubtopicModel.findById(subtopicId).session(session);
            if (!existingSubtopic) {
                throw new ApiError(404, 'Subtopic not found');
            }

            if(existingSubtopic.topic.toString() !== topicId){
                throw new ApiError(400, 'Subtopic does not belong to this topic');
            }

            // Prepare update data with basic fields
            const updateData: any = {
                title: title || existingSubtopic.title,
                description: description || existingSubtopic.description,
                // order: order || existingSubtopic.order,
                updatedAt: new Date(),
            };

            console.log("updateData-->", updateData)

            // Only process content type specific updates if:
            // 1. Content type is being changed, or
            // 2. New content is being provided for the same type
            const isContentTypeChanged = contentType && contentType !== existingSubtopic.contentType;
            const hasNewContent = (contentType === 'video' && (videoUrl || uploadedFiles?.length)) ||
                                (contentType === 'file' && uploadedFiles?.length) ||
                                (contentType === 'link' && links) ||
                                (contentType === 'text' && text_content);

            if(isContentTypeChanged){
            
                console.log("--> content type changed")
                console.log("new contentType", contentType)
                console.log("old contentType", existingSubtopic.contentType)
            }

            if(hasNewContent){
                console.log("--> constent type is same buthas new content")
            }

            if (isContentTypeChanged || hasNewContent) {
                // Update content type if changed
                if (isContentTypeChanged) {
                    updateData.contentType = contentType;
                    await cleanupOldContent(existingSubtopic);
                    console.log("--> cleanupOldContent done")
                }

                // Handle content type specific updates
                switch (contentType || existingSubtopic.contentType) {
                    case 'video':
                        if (videoUrl || uploadedFiles?.length) {
                            const videoData = await handleVideoUpdate(
                                videoUrl, 
                                uploadedFiles?.[0], 
                                videoName,
                                existingSubtopic.video
                            );
                            if (videoData) {
                                updateData.video = videoData;
                                updateData.files =[];
                                updateData.links = [];
                                updateData.text_content = "";
                            }
                        }
                        break;

                    case 'file':
                        if (uploadedFiles?.length) {
                            const { filesData } = await handleFilesUpdate(
                                uploadedFiles, 
                                fileNames || [],
                                existingSubtopic.files
                            );
                            updateData.files = filesData;
                            updateData.video = {};
                            updateData.links = [];
                            updateData.text_content = "";
                        }
                        break;

                    case 'link':
                        if (links) {
                            updateData.links = links.map((link: any) => ({
                                title: link.title,
                                url: link.url
                            }));
                            updateData.video = {};
                            updateData.files = [];
                            updateData.text_content = "";
                        }
                        break;

                    case 'text':
                        let audioUrl;
                        //need changes to save audio buffer
                        if (text_content) {

                            const audioBuffer = await textToSpeech(text_content, { outputFormat: 'buffer' }) as Buffer | null;
                            if (!audioBuffer) {
                              throw new ApiError(500, 'Failed to generate audio');
                            }

                            const uploadResult = await uploadOnCloudinary(audioBuffer, 'audio');
                            audioUrl = {
                            url: uploadResult.url,
                            public_id: uploadResult.public_id,
                            };

                            
                            updateData.text_content = text_content;
                            updateData.audioUrl = audioUrl
                            updateData.video = {};
                            updateData.files = [];
                            updateData.links = [];
                        
                        }
                        break;
                }
            }

            // Update subtopic
            const result = await SubtopicModel.findByIdAndUpdate(
                subtopicId,
                updateData,
                { new: true, session }
            ).lean().exec();

            if (!result) {
                throw new ApiError(500, 'Failed to update subtopic');
            }

            updatedSubtopic = result;

            console.log("updatedSubtopic-->", updatedSubtopic)
        });

        return new ApiResponse(200, {
            subtopic: updatedSubtopic,
        }, 'Subtopic updated successfully').send(res);
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        session.endSession();
    }
});









export const deleteSubtopic = asyncHandler(async (req: Request, res: Response) => {
    const { subtopicId, topicId } = req.body;
    const adminId = req.user?._id;

    console.log("--> deleting subtopic")
    console.log("subtopicId", subtopicId)
    console.log("topicId", topicId)
    // Input validation
    if (!adminId) {
        throw new ApiError(401, 'Unauthorized access');
    }

    if (!Types.ObjectId.isValid(subtopicId)) {
        throw new ApiError(400, 'Invalid subtopic ID');
    }

    if (!Types.ObjectId.isValid(topicId)) {
        throw new ApiError(400, 'Invalid topic ID');
    }

    const session = await startSession();
    let deletedSubtopic;

    try {
        await session.withTransaction(async () => {
            // Find and validate subtopic
            const subtopic = await SubtopicModel.findById(subtopicId).session(session);
            console.log("--> subtopic", subtopic)
            if (!subtopic) {
                throw new ApiError(404, 'Subtopic not found');
            }

            if (subtopic.topic.toString() !== topicId) {
                throw new ApiError(400, 'Subtopic does not belong to this topic');
            }

            // Clean up Cloudinary resources based on content type
            switch (subtopic.contentType) {
                case 'video':
                    console.log("--> deleting video")
                    if (subtopic.video?.public_id) {
                        await deleteFromCloudinary(subtopic.video.public_id);
                    }
                    break;
                case 'file':
                    console.log("--> deleting files")
                    if (subtopic.files?.length) {
                        await Promise.all(subtopic.files.map(async (file) => {
                            if (file.public_id) {
                                await deleteFromCloudinary(file.public_id);
                            }
                        }));
                    }
                    break;
            }

            // Find and delete related assessments and questions
            const allAssessments = await AssessmentModel.find({ subtopic: subtopicId }, '_id').session(session);
            const allAssessmentIds = allAssessments.map((assessment: any) => assessment._id);

            if (allAssessmentIds.length > 0) {
                await QuestionModel.deleteMany({ assessmentsId: { $in: allAssessmentIds } }, { session });
                await AssessmentModel.deleteMany({ subtopic: subtopicId }, { session });
            }

            // Remove subtopic from topic
            const updatedTopic = await TopicModel.findByIdAndUpdate(
                topicId,
                { $pull: { subtopics: subtopicId } },
                { new: true, session }
            );

            if (!updatedTopic) {
                throw new ApiError(500, 'Failed to update topic');
            }

            // Delete the subtopic
            deletedSubtopic = await SubtopicModel.findByIdAndDelete(subtopicId).session(session);
            if (!deletedSubtopic) {
                throw new ApiError(500, 'Failed to delete subtopic');
            }
        });

        return new ApiResponse(200, null, 'Subtopic and all related data deleted successfully').send(res);
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        session.endSession();
    }
}
    
    











































/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// export const deleteTopic = asyncHandler(async (req: Request, res: Response) => {
//     const { topicId, courseId } = req.body;
//     const adminId = req.user?._id;

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     if (!Types.ObjectId.isValid(topicId) || !Types.ObjectId.isValid(courseId)) {
//         throw new ApiError(400, 'Invalid topic or course ID');
//     }

//     const topic = await TopicModel.findById(topicId);
//     if (!topic) {
//         throw new ApiError(404, 'Topic not found');
//     }

//     if (topic.course.toString() !== courseId) {
//         throw new ApiError(400, 'Topic does not belong to this course');
//     }

//     //start a transaction
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const subtopics = await SubtopicModel.find({ topic: topicId }).session(session); //return [{},{}] of subtopics

//         if (subtopics.length > 0) { // if subtopics exist

//             for (const subtopic of subtopics) { //for each subtopic
//                 const assessments = await AssessmentModel.find({ subtopic: subtopic._id }).session(session); //all assessments related to this subtopic

//                 if (assessments.length > 0) { //if assessments exist
//                     for (const assessment of assessments) { //for each assessment
//                         await QuestionModel.deleteMany({ assessmentsId: assessment._id }, { session }); //delete all questions related to this assessment
//                     }
//                     await AssessmentModel.deleteMany({ subtopic: subtopic._id }, { session }); //delete all assessments related to this subtopic
//                 }
//             }
//             await SubtopicModel.deleteMany({ topic: topicId }, { session }); //delete all subtopics related to this topic
//         }

//         await CourseModel.findByIdAndUpdate(courseId, { $pull: { topics: topicId } }, { session }); //delete this topic from the course
//         await TopicModel.findByIdAndDelete(topicId).session(session); //delete this topic

//         await session.commitTransaction();
//         return new ApiResponse(200, null, 'Topic deleted successfully').send(res);

//     } catch (error) {
//         console.error('Delete Topic Error:', error);
//         await session.abortTransaction();
//         throw new ApiError(500, 'Error deleting topic and related data');
//     } finally {
//         await session.endSession();
//     }
// });





//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>subtopic related controllers   >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



//create subtopic



// export const createSubtopic = asyncHandler(async (req: Request, res: Response) => {
//     try {

//         const { topicId, courseId } = req.body;
//         const adminId = req.user?._id;

//         if (!adminId) {
//             throw new ApiError(401, 'Unauthorized access');
//         }

//         if (!Types.ObjectId.isValid(topicId) || !Types.ObjectId.isValid(courseId)) {
//             throw new ApiError(400, 'Invalid topic or course ID');
//         }

//         const topic = await TopicModel.findById(topicId);
//         if (!topic) {
//             throw new ApiError(404, 'Topic not found');
//         }

//         if (topic.course.toString() !== courseId) {
//             throw new ApiError(400, 'Topic does not belong to this course');
//         }
        
        

//         console.log("📦 Request body:", req.body);
//         console.log("📁 Uploaded files:", req.files);

//         // Validate request body
//         const validatedData = req.body;
//         const { contentType } = validatedData;

//         // Handle content based on type
//         switch (contentType) {
//             case 'text':
//                 // For text content, no file handling needed
//                 break;

//             case 'video':
//                 if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
//                     throw new ApiError(400, 'Video file is required');
//                 }

//                 const videoFile = req.files[0];
//                 console.log("📦 Video file:", videoFile);


//                 const videoUploadResult = await uploadOnCloudinary(videoFile.path, 'video');
//                 console.log("📦 Video upload result:", videoUploadResult);
//                 // Clean up the uploaded file
//                 if (fs.existsSync(videoFile.path)) {
//                     fs.unlinkSync(videoFile.path);
//                 }

//                 validatedData.video = {
//                     name: req.body.videoName || videoFile.originalname,
//                     url: videoUploadResult?.url,
//                     public_id: videoUploadResult?.public_id
//                 };
//                 console.log("📦 Validated data:", validatedData);
//                 break;

//             case 'file':
//                 if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
//                     throw new ApiError(400, 'At least one file is required');
//                 }

//                 const uploadedFiles = await Promise.all(
//                     req.files.map(async (file: any) => {
//                         // const result = await cloudinary.uploader.upload(file.path, {
//                         //     resource_type: 'auto',
//                         //     folder: 'course-content/files'
//                         // });
//                         console.log("📦 File:", file);
//                         const result = await uploadOnCloudinary(file.path, 'file');

//                         console.log("📦 File upload result:", result);

//                         // Clean up the uploaded file
//                         if (fs.existsSync(file.path)) {
//                             fs.unlinkSync(file.path);
//                         }

//                         return {
//                             name:  file.name ? file.name : file.originalname,
//                             url: result?.url,
//                             public_id: result?.public_id,
//                             type: file.mimetype
//                         };
//                     })
//                 );

//                 console.log("📦 Uploaded files:", uploadedFiles);

//                 validatedData.files = uploadedFiles;

//                 console.log("📦 Validated data:", validatedData);
//                 break;

//             case 'link':
//                 // For links, validate the array structure
//                 if (!Array.isArray(validatedData.links) || validatedData.links.length === 0) {
//                     throw new ApiError(400, 'At least one link is required');
//                 }
//                 break;

//             default:
//                 throw new ApiError(400, 'Invalid content type');
//         }

//         // Create subtopic in database
//         const subtopic = await SubtopicModel.create({
//             topic: topicId,
//             title: validatedData.title,
//             description: validatedData.description,
//             order: validatedData.order,
//             contentType: validatedData.contentType,
//             text_content: validatedData.text_content,
//             video: validatedData.video,
//             files: validatedData.files,
//         });

//         console.log("📦 Subtopic created:", subtopic);

//         if(!subtopic){
//             throw new ApiError(500, 'Failed to create subtopic');
//         }

//         const updatedTopic = await TopicModel.findByIdAndUpdate(
//             validatedData.topicId,
//             { $push: { subtopics: subtopic._id } },
//             { new: true }
//         ).populate('subtopics').lean().exec();

//         console.log("📦 Updated topic:", updatedTopic);

//         if(!updatedTopic){
//             throw new ApiError(500, 'Failed to update topic');
//         }
        

//         return new ApiResponse(201, {
//             ...updatedTopic
//         }, 'Subtopic created successfully').send(res);

//     } catch (error: any) {
//         console.error('Error creating subtopic:', error);
        
//         // Clean up any uploaded files in case of error
//         if (req.files && Array.isArray(req.files)) {
//             req.files.forEach((file: any) => {
//                 if (fs.existsSync(file.path)) {
//                     fs.unlinkSync(file.path);
//                 }
//             });
//         }

//         throw new ApiError(
//             error.statusCode || 500,
//             error.message || 'Failed to create subtopic'
//         );
//     }
// });









// Update Subtopic

// export const updateSubtopic = asyncHandler(async (req: Request, res: Response) => {
//     console.log("🧪 Starting subtopic update...");
//     const { subtopicId, title, description, contentType, text_content, video, files, links } = req.body;
//     const adminId = req.user?._id;
//     const uploadedFiles = req.files as Express.Multer.File[];

//     console.log("➡️ [REQUEST BODY]", req.body);
//     console.log("📁 Uploaded Files:", uploadedFiles);
//     console.log("✅ Admin ID:", adminId);

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     if (!Types.ObjectId.isValid(subtopicId)) {
//         throw new ApiError(400, 'Invalid subtopic ID');
//     }

//     const session = await startSession();
//     let updatedSubtopic: ISubtopic | null = null;

//     try {
//         console.log("🧪 Starting subtopic update...");
        
//         await session.withTransaction(async () => {
//             // Find the subtopic
//             const existingSubtopic = await SubtopicModel.findById(subtopicId).session(session);
//             if (!existingSubtopic) {
//                 throw new ApiError(404, 'Subtopic not found');
//             }

            

//             let videoData = existingSubtopic.video;
//             let filesData = existingSubtopic.files;
//             let linksData = existingSubtopic.links;

//             // Handle content type change
//             if (contentType && contentType !== existingSubtopic.contentType) {
//                 console.log("🔄 Content type changed, cleaning up old content...");
                
//                 // Clean up old content based on previous content type
//                 switch (existingSubtopic.contentType) {
//                     case 'video':
//                         if (existingSubtopic.video) {
//                             console.log("🗑️ Deleting old video from Cloudinary...");
//                             try {
//                                 await deleteFromCloudinary(existingSubtopic.video.url);
//                                 console.log("✅ Old video deleted successfully");
//                             } catch (error) {
//                                 console.error("❌ Error deleting old video:", error);
//                             }
//                         }
//                         break;
//                     case 'file':
//                         if (existingSubtopic.files?.length) {
//                             console.log("🗑️ Deleting old files from Cloudinary...");
//                             try {
//                                 await Promise.all(existingSubtopic.files.map(async (file) => {
//                                     if (file.url) {
//                                         await deleteFromCloudinary(file.url);
//                                     }
//                                 }));
//                                 console.log("✅ Old files deleted successfully");
//                             } catch (error) {
//                                 console.error("❌ Error deleting old files:", error);
//                             }
//                         }
//                         break;
//                     case 'link':
//                         console.log("🗑️ Clearing old links...");
//                         break;
//                     case 'text':
//                         console.log("🗑️ Clearing old text content...");
//                         break;
//                 }

//                 // Reset content based on new type
//                 switch (contentType) {
//                     case 'text':
//                         console.log("📝 Switching to text content type, clearing all media...");
//                         videoData = undefined;
//                         filesData = undefined;
//                         linksData = undefined;
//                         break;
//                     case 'video':
//                         console.log("🎥 Switching to video content type, clearing other media...");
//                         filesData = undefined;
//                         linksData = undefined;
//                         break;
//                     case 'file':
//                         console.log("📁 Switching to file content type, clearing other media...");
//                         videoData = undefined;
//                         linksData = undefined;
//                         break;
//                     case 'link':
//                         console.log("🔗 Switching to link content type, clearing other media...");
//                         videoData = undefined;
//                         filesData = undefined;
//                         break;
//                 }
//             }

//             // Handle video update
//             if (contentType === 'video' && video) {
//                 console.log("🎥 Handling video content update...");
                
//                 // Delete old video if exists
//                 if (existingSubtopic.video?.url) {
//                     console.log("🗑️ Deleting old video from Cloudinary...");
//                     await deleteFromCloudinary(existingSubtopic.video.url);
//                 }

//                 if (video.file) {
//                     const videoFile = uploadedFiles.find(f => f.originalname || f.filename === video.file);
//                     if (!videoFile) {
//                         throw new ApiError(400, `Video file not found: ${video.file}`);
//                     }
//                     const videoUploadResult = await uploadOnCloudinary(videoFile.path, 'video');
//                     if (!videoUploadResult) {
//                         throw new ApiError(500, 'Failed to upload video file');
//                     }
//                     // Clean up the uploaded file
//                     try {
//                         if (fs.existsSync(videoFile.path)) {
//                             fs.unlinkSync(videoFile.path);
//                             console.log(`✅ Deleted file: ${videoFile.path}`);
//                         }
//                     } catch (error) {
//                         console.error(`❌ Error deleting file ${videoFile.path}:`, error);
//                     }
//                     videoData = {
//                         url: videoUploadResult.url,
//                         file: videoUploadResult.url
//                     };
//                 } else if (video.url) {
//                     videoData = {
//                         url: video.url,
//                         file: undefined
//                     };
//                 }
//             }

//             // Handle files update
//             if (contentType === 'file' && files) {
//                 console.log("📁 Handling files content update...");
                
//                 // Delete old files if exist
//                 if (existingSubtopic.files?.length) {
//                     console.log("🗑️ Deleting old files from Cloudinary...");
//                     await Promise.all(existingSubtopic.files.map(async (file) => {
//                         if (file.url) {
//                             await deleteFromCloudinary(file.url);
//                         }
//                     }));
//                 }

//                 filesData = await Promise.all(files.map(async (file: any) => {
//                     if (file.type === 'file' && file.file) {
//                         const uploadedFile = uploadedFiles.find(f => f.originalname === file.file);
//                         if (!uploadedFile) {
//                             throw new ApiError(400, `File not found: ${file.file}`);
//                         }
//                         const fileUploadResult = await uploadOnCloudinary(uploadedFile.path, 'file');
//                         if (!fileUploadResult) {
//                             throw new ApiError(500, 'Failed to upload file');
//                         }
//                         // Clean up the uploaded file
//                         try {
//                             if (fs.existsSync(uploadedFile.path)) {
//                                 fs.unlinkSync(uploadedFile.path);
//                                 console.log(`✅ Deleted file: ${uploadedFile.path}`);
//                             }
//                         } catch (error) {
//                             console.error(`❌ Error deleting file ${uploadedFile.path}:`, error);
//                         }
//                         return {
//                             name: file.name,
//                             url: fileUploadResult.url,
//                             type: 'file'
//                         };
//                     } else if (file.type === 'url' && file.url) {
//                         return {
//                             name: file.name,
//                             url: file.url,
//                             type: 'url'
//                         };
//                     }
//                     throw new ApiError(400, 'Invalid file configuration');
//                 }));
//             }

//             // Handle links update
//             if (contentType === 'link' && links) {
//                 console.log("🔗 Handling links content update...");
//                 linksData = links.map((link: any) => ({
//                     title: link.title,
//                     url: link.url,
//                     description: link.description || null
//                 }));
//             }

//             // Update the subtopic
//             const result = await SubtopicModel.findByIdAndUpdate(
//                 subtopicId,
//                 {
//                     title: title || existingSubtopic.title,
//                     description: description || existingSubtopic.description,
//                     contentType: contentType || existingSubtopic.contentType,
//                     text_content: contentType === 'text' ? text_content : undefined,
//                     video: contentType === 'video' ? videoData : undefined,
//                     files: contentType === 'file' ? filesData : undefined,
//                     links: contentType === 'link' ? linksData : undefined,
//                     updatedAt: new Date()
//                 },
//                 { new: true, session }
//             );

//             if (!result) {
//                 throw new ApiError(500, 'Failed to update subtopic');
//             }

//             updatedSubtopic = result as ISubtopic;
//             console.log("✅ Subtopic updated successfully:", updatedSubtopic._id);
//         });

//         console.log("✅ Transaction completed successfully");

//         if (!updatedSubtopic) {
//             throw new ApiError(500, 'Failed to update subtopic');
//         }

//         return new ApiResponse(200, {
//             subtopic: updatedSubtopic
//         }, 'Subtopic updated successfully').send(res);

//     } catch (error) {
//         console.error('❌ Subtopic update failed:', error);
//         if (session.inTransaction()) {
//             await session.abortTransaction();
//         }
//         session.endSession();
//         throw new ApiError(500, 'Subtopic update failed');
//     } finally {
//         session.endSession();
//     }
// });






// Delete Subtopic
// export const deleteSubtopic = asyncHandler(async (req: Request, res: Response) => {
//     const { subtopicId } = req.params;
//     const adminId = req.user?._id;

//     if (!adminId) {
//         throw new ApiError(401, 'Unauthorized access');
//     }

//     const subtopic = await SubtopicModel.findOne({
//         _id: subtopicId,
//         topic: { 
//             $in: await TopicModel.find({
//                 course: { 
//                     $in: await CourseModel.find({
//                         'linked_entities.organization': { 
//                             $in: await OrganizationModel.find({ admin: adminId }).distinct('_id') 
//                         }
//                     }).distinct('_id')
//                 }
//             }).distinct('_id')
//         }
//     });

//     if (!subtopic) {
//         throw new ApiError(404, 'Subtopic not found');
//     }

//     await SubtopicModel.findByIdAndDelete(subtopicId);
//     await TopicModel.findByIdAndUpdate(subtopic.topic, {
//         $pull: { subtopics: subtopicId },
//         updatedAt: new Date()
//     });

//     return new ApiResponse(200, null, 'Subtopic deleted successfully').send(res);
// }); 






///store sitch case:
 // switch (contentType) {
        //     case 'text':
        //         // No special handling needed
        //         break;

        //     case 'video':
        //         if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        //             throw new ApiError(400, 'Video file is required');
        //         }

        //         const videoFile = req.files[0];
        //         console.log("📦 Video file:", videoFile);

        //         const videoUploadResult = await uploadOnCloudinary(videoFile.path, 'video');
        //         uploded_file_public_id.push(videoUploadResult?.public_id);
        //         console.log("📦 Video upload result:", videoUploadResult);

        //         if (fs.existsSync(videoFile.path)) {
        //             fs.unlinkSync(videoFile.path);
        //         }

        //         validatedData.video = {
        //             name: req.body.videoName || videoFile.originalname,
        //             url: videoUploadResult?.url,
        //             public_id: videoUploadResult?.public_id
        //         };
        //         console.log("📦 Validated data:", validatedData);
        //         break;

        //     case 'file':
        //         if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        //             throw new ApiError(400, 'At least one file is required');
        //         }

        //         let fileNames:any[] = [];

        //         if (validatedData.files) {
        //             if (Array.isArray(validatedData.files)) {
        //                 fileNames = validatedData.files;
        //             } else if (typeof validatedData.files === 'string') {
        //                 try {
        //                     fileNames = JSON.parse(validatedData.files);
        //                 } catch (error) {
        //                     console.error("Failed to parse 'files' from body", error);
        //                     throw new ApiError(400, 'Invalid files format');
        //                 }
        //             } else {
        //                 throw new ApiError(400, 'Invalid files format');
        //             }
        //         }


        //         const uploadedFiles = await Promise.all(
        //             req.files.map(async (file: any, index: number) => {
        //                 console.log("📦 File:", file);

        //                 const result = await uploadOnCloudinary(file.path, 'file');
        //                 uploded_file_public_id.push(result?.public_id);
        //                 console.log("📦 File upload result:", result);

        //                 if (fs.existsSync(file.path)) {
        //                     fs.unlinkSync(file.path);
        //                 }

        //                 return {
        //                     name: fileNames[index]?.name || file.originalname,
        //                     url: result?.url,
        //                     public_id: result?.public_id,
        //                     type: file.mimetype
        //                 };
        //             })
        //         );

        //         console.log("📦 Uploaded files:", uploadedFiles);

        //         validatedData.files = uploadedFiles;
        //         console.log("📦 Validated data:", validatedData);
        //         break;

        //     case 'link':
        //         let linksArray:any[] = [];
        //         if (validatedData.links) {
        //             if (Array.isArray(validatedData.links)) {
        //                 linksArray = validatedData.links;
        //             } else if (typeof validatedData.links === 'string') {
        //                 try {
        //                     linksArray = JSON.parse(validatedData.links);   
        //                 } catch (error) {
        //                     console.error("Failed to parse 'links' from body", error);
        //                     throw new ApiError(400, 'Invalid links format');
        //                 }
        //             } else {
        //                 throw new ApiError(400, 'Invalid links format');
        //             }
        //         }
        //         validatedData.links = linksArray;
        //         console.log("📦 Validated data:", validatedData);

        //         break;

        //     default:
        //         throw new ApiError(400, 'Invalid content type');
        // }
)