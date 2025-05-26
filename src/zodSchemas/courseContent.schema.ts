import { z } from 'zod';

// Common URL validation
const urlSchema = z.string().url("Invalid URL format").trim();

// Video schema with improved validation
const videoSchema = z.object({
    url: urlSchema.optional(),
    file: z.any().optional()
}).refine(
    (data) => !!(data.url || data.file),
    {
        message: "Either video URL or file must be provided",
        path: ["video"]
    }
).refine(
    (data) => {
        if (data.url) {
            return data.url.endsWith('.mp4') || data.url.includes('video');
        }
        return true;
    },
    {
        message: "Video URL must be a valid video file (preferably .mp4)",
        path: ["video", "url"]
    }
);

// File schema with improved validation
const fileSchema = z.object({
    name: z.string()
        .min(1, "File name is required")
        .max(100, "File name must be less than 100 characters")
        .trim(),
    url: urlSchema.optional(),
    file: z.any().optional(),
    type: z.enum(['file', 'url'], {
        required_error: "File type is required",
        invalid_type_error: "File type must be either 'file' or 'url'"
    })
}).refine(
    (data) => {
        if (data.type === 'url') {
            return !!data.url;
        }
        if (data.type === 'file') {
            return !!data.file;
        }
        return true;
    },
    {
        message: "URL is required for type 'url' and file is required for type 'file'",
        path: ["type"]
    }
).refine(
    (data) => {
        if (data.url) {
            const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'];
            return validExtensions.some(ext => data.url?.toLowerCase().endsWith(ext));
        }
        return true;
    },
    {
        message: "File URL must have a valid extension (.pdf, .doc, .docx, .txt, .xls, .xlsx)",
        path: ["url"]
    }
);

// Link schema with improved validation
const linkSchema = z.object({
    title: z.string()
        .min(1, "Link title is required")
        .max(100, "Link title must be less than 100 characters")
        .trim(),
    url: urlSchema,
    description: z.string()
        .max(500, "Description must be less than 500 characters")
        .optional()
        .nullable()
});

// Subtopic schema with improved validation
const subtopicSchema = z.object({
    title: z.string()
        .min(1, "Title is required")
        .max(200, "Title must be less than 200 characters")
        .trim(),
    description: z.string()
        .min(1, "Description is required")
        .max(1000, "Description must be less than 1000 characters")
        .trim(),
    contentType: z.enum(['text', 'video', 'file', 'link'], {
        required_error: "Content type is required",
        invalid_type_error: "Content type must be one of: text, video, file, link"
    }),
    text_content: z.string()
        .min(1, "Text content is required")
        .max(10000, "Text content must be less than 10000 characters")
        .optional()
        .nullable(),
    video: videoSchema.optional(),
    files: z.array(fileSchema)
        .min(1, "At least one file is required for file content type")
        .max(10, "Maximum 10 files allowed")
        .optional(),
    links: z.array(linkSchema)
        .min(1, "At least one link is required for link content type")
        .max(20, "Maximum 20 links allowed")
        .optional()
}).refine(
    (data) => {
        switch (data.contentType) {
            case 'text':
                return !!data.text_content;
            case 'video':
                return !!data.video;
            case 'file':
                return !!(data.files && data.files.length > 0);
            case 'link':
                return !!(data.links && data.links.length > 0);
            default:
                return true;
        }
    },
    {
        message: "Invalid content type configuration. Required fields are missing",
        path: ["contentType"]
    }
);

// Topic schema with improved validation
const topicSchema = z.object({
    title: z.string()
        .min(1, "Topic title is required")
        .max(200, "Topic title must be less than 200 characters")
        .trim(),
    description: z.string()
        .min(1, "Topic description is required")
        .max(1000, "Topic description must be less than 1000 characters")
        .trim(),
    subtopics: z.array(subtopicSchema)
        .min(1, "At least one subtopic is required")
        .max(50, "Maximum 50 subtopics allowed")
});

// Course content creation schema with improved validation
export const courseContentSchema = z.object({
    courseId: z.string()
        .min(1, "Course ID is required"),
    topics: z.array(topicSchema)
        .min(1, "At least one topic is required")
        
});

// Course content creation request schema
export const courseContentCreationSchema = z.object({
    body: courseContentSchema
});
