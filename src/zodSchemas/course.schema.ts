import { z } from 'zod';

// Base course schema
export const courseSchema = z.object({
    courseId: z.string().min(1, "Course ID is required").optional(),
    title: z.string().min(1, "Title is required").trim(),
    description: z.string().min(1, "Description is required").trim(),
    duration: z.string().min(1, "Duration is required").trim(),
    skills: z.array(z.string()).min(1, "At least one skill is required"),
    image_url: z.string().url("Invalid image URL"),
    instructors: z.array(z.string()).min(1, "At least one instructor is required"),     
    ai_settings: z.object({
        persona_prompt: z.string().min(1, "Persona prompt is required"),
        ability_prompt: z.string().min(1, "Ability prompt is required"),
        rag_documents: z.array(z.object({
            name: z.string().min(1, "Document name is required"),
            url: z.string().url("Invalid document URL"),
            vectorized: z.boolean().default(false)
        })).optional()
    })
});




// Course update schema
export const courseUpdateSchema = courseSchema.partial();






// Course ID schema
export const courseIdSchema = z.object({
    params: z.object({
        courseId: z.string().min(1, "Course ID is required")
    })
});





// Course creation schema
export const courseCreationSchema = z.object({
    body: courseSchema
}); 