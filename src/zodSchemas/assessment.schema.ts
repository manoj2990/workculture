import { z } from 'zod';

// Question schema
export const questionSchema = z.object({
    questionId: z.string().optional(),
    // order: z.number(),
    questionText: z.string().min(1, "Question text is required").trim(),
    questionType: z.enum(['multiple_choice', 'descriptive', 'video', 'audio'], {
        required_error: "Question type is required",
        invalid_type_error: "Invalid question type"
    }),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    sampleAnswer: z.string().optional(),
    instructions: z.string().optional()

});

// Assessment schema
export const assessmentSchema = z.object({
    title: z.string().min(1, "Assessment title is required"),
    // order: z.number().optional(),
    questions: z.array(questionSchema).min(1, "At least one question is required")
});

// Subtopic schema
export const subtopicSchema = z.object({
    subtopicId: z.string().min(1, "Subtopic ID is required"),
    // order: z.number().optional(),
    assessments: z.array(assessmentSchema).optional()
});

// Main input schema
export const assessmentCreationSchema = z.object({
    courseId: z.string().min(1, "Course ID is required"),
    topicId: z.string().min(1, "Topic ID is required"),
    subtopics: z.array(subtopicSchema).min(1, "At least one subtopic is required")
});





// Assessment update schema
export const assessmentUpdateSchema = z.object({
    assessmentId: z.string().min(1, "Assessment ID is required"),
    title: z.string().min(1, "Assessment title is required").optional(),
    order: z.number().optional(),
    questions: z.array(z.object({
        questionId: z.string().optional(),
        order: z.number().optional(),
        questionText: z.string().min(1, "Question text is required").trim().optional(),
        questionType: z.enum(['multiple_choice', 'descriptive', 'video', 'audio'], {
            required_error: "Question type is required",
            invalid_type_error: "Invalid question type"
        }).optional(),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string().optional(),
        sampleAnswer: z.string().optional(),
        instructions: z.string().optional()
    
    })).optional()
}); 





// Assessment ID schema
export const assessmentIdSchema = z.object({
    params: z.object({
        assessmentId: z.string().min(1, "Assessment ID is required")
    })
}); 