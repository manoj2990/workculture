import { Schema, z } from 'zod';


// Topic schema
export const topicSchema = z.object({
    courseId: z.string().min(1, "Course ID is required"),
    title: z.string().min(1, "Topic title is required").trim(),
    description: z.string().min(1, "Topic description is required").trim(),
    // order: z.number().min(1, "Order is required").optional(),
});


// Topic update schema
export const topicUpdateSchema = z.object({
    courseId: z.string().min(1, "Course ID is required"),
    topicId: z.string().min(1, "Topic ID is required"),
    title: z.string().min(1, "Topic title is required").trim().optional(),
    description: z.string().min(1, "Topic description is required").trim().optional(),
    // order: z.number().min(1, "Order is required").optional(),
});




//>>>>>>>>>>>>>>>>>>>>>>>>>



// Base file schema for uploads
const videoSchema = z.object({
    fieldname: z.string().trim(),
    originalname: z.string().trim(),
    encoding: z.string().trim(),
    mimetype: z.string().trim(),
    destination: z.string().trim(),
    filename: z.string().trim(),
    path: z.string().trim(),
    size: z.number()
});


// const fileSchema = z.object({
//     fieldname: z.string().trim(),
//     originalname: z.string().trim(),
//     encoding: z.string().trim(),
//     mimetype: z.string().trim(),
//     destination: z.string().trim(),
//     filename: z.string().trim(),
//     path: z.string().trim(),
//     size: z.number()
// });

// Video schema
// const videoSchema = z.object({
//     name: z.string().min(1, "Video name is required").trim(),
//     url: z.string().url("Invalid video URL").trim(),
//     // public_id: z.string().trim()
// });

// File schema
// const fileSchema = z.object({
//     name: z.string().min(1, "File name is required").trim().optional(),
//     url: z.string().url("Invalid file URL").trim().optional(),
//     public_id: z.string().trim().optional(),
//     type: z.string().trim().optional()
// });

const fileSchema = z.object({
    name: z.string().trim(),
    url: z.string().trim().optional(), // Make optional for validation
    public_id: z.string().trim().optional(),
    type: z.string().trim(),
  });

// Link schema
const linkSchema = z.object({
    title: z.string().min(1, "Link title is required").trim(),
    url: z.string().url("Invalid URL format").trim()
}).refine(
    (data) => {
        return data.url.startsWith('http://') || data.url.startsWith('https://');
    },
    {
        message: "Invalid URL format"
})  ;

// Main subtopic schema
export const subtopicSchema = z.object({
    courseId: z.string().min(1, "Course ID is required").trim(),
    topicId: z.string().min(1, "Topic ID is required").trim(),
    title: z.string().min(1, "Subtopic title is required").transform(val => val.trim()),
    description: z.string().min(1, "Subtopic description is required").transform(val => val.trim()),
    // order: z.string().transform(val => Number(val.trim())).refine(val => !isNaN(val) && val >= 0, {
    //     message: "Order must be a number greater than or equal to 0"
    // }).optional(),
    contentType: z.enum(['text', 'video', 'file', 'link'], {
        required_error: "Content type is required",
        invalid_type_error: "Content type must be one of: text, video, file, link"
    }),
    // Content type specific fields
    text_content: z.string().min(1, "Text content is required").trim().optional(),
    image:z.string().min(1, "Image is required").trim().optional(),
    videoName: z.string().min(1, "Video name is required").trim().optional(),
    videoUrl: z.string().url("Invalid video URL").trim().optional(),
    video: videoSchema.optional(),
    files: z.array(fileSchema).optional(),
    links:  z.array(linkSchema).optional()
}).refine(
    (data) => {
        switch (data.contentType) {
            case 'text':
                return !!data.text_content;
            case 'video':
                // console.log("data--->",data)
                // console.log("data.video-->",data.videoUrl )
                // console.log("data.video-->",data.video)
                // console.log("req.file-->",req.file)
                return !!(data.videoUrl || data.video);
            case 'file':
                return !!data.files && data.files.length > 0;
            case 'link':
                return !!data.links && data.links.length > 0;
            default:
                return true;
        }
    },
    {
        message: "Required content is missing for the specified content type",
        path: ["contentType"]
    }
);




// // Subtopic update schema
export const subtopicUpdateSchema = z.object({
    topicId: z.string().min(1, "Topic ID is required"),
    subtopicId: z.string().min(1, "Subtopic ID is required"),
    title: z.string().min(1, "Title is required").trim().optional(),
    description: z.string().min(1, "Description is required").trim().optional(),
    // order: z.string().transform(val => Number(val.trim())).refine(val => !isNaN(val) && val >= 0, {
    //     message: "Order must be a number greater than or equal to 0"
    // }).optional(),
    contentType: z.enum(['text', 'video', 'file', 'link'], {
        required_error: "Content type is required",
        invalid_type_error: "Content type must be one of: text, video, file, link"
    }).optional(),
    videoName: z.string().min(1, "Video name is required").trim().optional(),
    videoUrl: z.string().url("Invalid video URL").trim().optional(),
    video: videoSchema.optional(),
    text_content: z.string().optional(),
    files: z.array(fileSchema).optional(),
    links: z.array(linkSchema).optional()
}).refine(
    (data) => {
        switch (data.contentType) {
            case 'text':
                return !!data.text_content;
            case 'video':
                return !!(data.videoUrl || data.video);
            case 'file':
                return !!data.files && data.files.length > 0;
            case 'link':
                return !!data.links && data.links.length > 0;
            default:
                return true;
        }
    },
    {
        message: "Required content is missing for the specified content type",
        path: ["contentType"]
    }
);




















// // Topic creation schema
// export const topicCreationSchema = z.object({
//     topicSchema
//     // modules: z.array(subtopicModuleSchema)
// });


// // Subtopic creation schema
// export const subtopicCreationSchema = z.object({
//     body: subtopicSchema
// });

// // Common URL validation
// const urlSchema = z.string().url("Invalid URL format").trim();

// // Video schema
// const videoSchema = z.object({
//     url: urlSchema.optional(),
//     file: z.any().optional()
// }).refine(
//     (data) => !!(data.url || data.file),
//     {
//         message: "Either video URL or file must be provided",
//         path: ["video"]
//     }
// );

// // File schema
// const fileSchema = z.object({
//     name: z.string()
//         .min(1, "File name is required")
//         .max(100, "File name must be less than 100 characters")
//         .trim(),
//     url: urlSchema.optional(),
//     file: z.any().optional(),
//     type: z.enum(['file', 'url'], {
//         required_error: "File type is required",
//         invalid_type_error: "File type must be either 'file' or 'url'"
//     })
// });

// // Link schema
// const linkSchema = z.object({
//     title: z.string()
//         .min(1, "Link title is required")
//         .max(100, "Link title must be less than 100 characters")
//         .trim(),
//     url: urlSchema,
//     description: z.string()
//         .max(500, "Description must be less than 500 characters")
//         .optional()
//         .nullable()
// });

// // Subtopic update schema
// export const subtopicUpdateSchema = z.object({
//     subtopicId: z.string().min(1, "Subtopic ID is required"),
//     title: z.string()
//         .min(1, "Title is required")
//         .max(200, "Title must be less than 200 characters")
//         .trim()
//         .optional(),
//     description: z.string()
//         .min(1, "Description is required")
//         .max(1000, "Description must be less than 1000 characters")
//         .trim()
//         .optional(),
    // contentType: z.enum(['text', 'video', 'file', 'link'], {
    //     required_error: "Content type is required",
    //     invalid_type_error: "Content type must be one of: text, video, file, link"
    // }).optional(),
//     text_content: z.string()
//         .min(1, "Text content is required")
//         .max(10000, "Text content must be less than 10000 characters")
//         .optional()
//         .nullable(),
//     video: videoSchema.optional(),
//     files: z.array(fileSchema)
//         .min(1, "At least one file is required for file content type")
//         .max(10, "Maximum 10 files allowed")
//         .optional(),
//     links: z.array(linkSchema)
//         .min(1, "At least one link is required for link content type")
//         .max(20, "Maximum 20 links allowed")
//         .optional()
// });





// // Subtopic update request schema
// // export const subtopicUpdateRequestSchema = z.object({
// //      subtopicUpdateSchema
// // });

// // ID schemas
// export const topicIdSchema = z.object({
//     params: z.object({
//         topicId: z.string().min(1, "Topic ID is required")
//     })
// });

// export const subtopicIdSchema = z.object({
//     params: z.object({
//         subtopicId: z.string().min(1, "Subtopic ID is required")
//     })
// }); 


// export const subtopicUpdateSchema = z.object({
//     subtopicId: z.string().min(1, "Subtopic ID is required"),
//     title: z.string()
//         .min(1, "Title is required")
//         .max(200, "Title must be less than 200 characters")
//         .trim()
//         .optional(),
//     description: z.string()
//         .min(1, "Description is required")
//         .max(1000, "Description must be less than 1000 characters")
//         .trim()
//         .optional(),
//     contentType: z.enum(['text', 'video', 'file', 'link'], {
//         required_error: "Content type is required",
//         invalid_type_error: "Content type must be one of: text, video, file, link"
//     }).optional(),
//     text_content: z.string().optional(),
//     video: z.object({
//         file: z.string().optional(),
//         url: z.string().optional()
//     }).optional(),
//     files: z.array(z.object({
//         fieldname: z.string(),
//         originalname: z.string(),
//         encoding: z.string(),
//         mimetype: z.string(),
//         destination: z.string(),
//         filename: z.string(),
//         path: z.string(),
//         size: z.number()
//     })).optional(),
//     links: z.array(z.string()).optional()
// });

