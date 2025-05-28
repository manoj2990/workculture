import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodEffects } from 'zod';
import ApiError from '@/utils/apiError.utils';

//if we use superRefine in zod schema,we need to use ZodEffects<AnyZodObject>
// export const validateSchema = (schema: AnyZodObject | ZodEffects<AnyZodObject>) => 
//     async (req: Request, res: Response, next: NextFunction) => {
//         console.log("validateSchema middleware called");
//         console.log("req.body", req.body);
//         try {
//             const result = await schema.parseAsync({
//                 body: req.body,
//                 headers: req.headers,
//                 cookies: req.cookies,
//                 query: req.query,
//                 params: req.params
//             });
//             console.log("validateSchema result", result);
//             next();
//         } catch (error) {
//             if (error instanceof ZodError) {
//                 const errors = error.errors.map(err => ({
//                     field: err.path.join('.'),
//                     message: err.message
//                 }));
//                 next(new ApiError(400, 'Validation Error', errors));
//             } else {
//                 next(error);
//             }
//         }
//     }; 


////////////////////////////////


// interface ValidationError {
//     field: string;
//     message: string;
//     code: string;
// }

// interface ValidationErrorResponse {
//     message: string;
//     errors: Record<string, ValidationError[]>;
// }

// export const validateSchema = (schema: AnyZodObject | ZodEffects<AnyZodObject>) => 
//     async (req: Request, res: Response, next: NextFunction) => {
//         console.log("validateSchema middleware called");
//         console.log("req.body", req.body);
//         const links = req.body?.links ? JSON.parse(req.body?.links) : req.body?.links;
//         req.body.links = links;
//         const files = req.body?.files ? JSON.parse(req.body?.files) : req.body?.files;
//         req.body.files = files;
//         const videoFile = (req.files as Express.Multer.File[])?.find(file => file.fieldname === 'video');
//         req.body.video = videoFile;
//         console.log("after parsing links and files")
//         console.log("req.body", req.body)
//         console.log("req.files", req.files)
//         console.log("req.body.links", req.body.links)
//         console.log("req.body.files", req.body.files)
//         console.log("req.body.video", req.body.video)

//         try {
//             const result = await schema.parseAsync(req.body);
//             console.log("validateSchema result", result);
//             req.body = result; // attach the validated body
//             next();
//         } catch (error) {
//             if (error instanceof ZodError) {
//                 // Format errors for better readability
//                 const formattedErrors = error.errors.map(err => {
//                     const path = err.path.join('.');
//                     let message = err.message;
                    
//                     // Add more context for nested objects
//                     if (path.includes('.')) {
//                         const [parent, ...rest] = path.split('.');
//                         message = `${parent}: ${message}`;
//                     }
                    
//                     // Add specific error types
//                     if (err.code === 'invalid_type') {
//                         message = `Invalid type for ${path}: ${message}`;
//                     } else if (err.code === 'too_small') {
//                         message = `${path} is too short: ${message}`;
//                     } else if (err.code === 'too_big') {
//                         message = `${path} is too long: ${message}`;
//                     } else if (err.code === 'invalid_enum_value') {
//                         message = `Invalid value for ${path}: ${message}`;
//                     } else if (err.code === 'invalid_union') {
//                         message = `Invalid value for ${path}: ${message}`;
//                     }
                    
//                     return {
//                         field: path,
//                         message: message,
//                         code: err.code
//                     };
//                 });

//                 // Log the detailed errors for debugging
//                 console.log('Validation Errors:', formattedErrors);

//                 next(new ApiError(400, 'Validation Error', formattedErrors));
//             } else {
//                 next(error);
//             }
//         }
//     };



    ////////////////////////////


 

// File + Filename Mapping Helper
// function assignFilenamesToFiles(
//   files: Express.Multer.File[],
//   filenames: string[]
// ) {
//   return files.map((file, index) => ({
//     ...file,
//     customName: filenames[index] || file.originalname, // fallback to original name
//   }));
// }

// export const validateSchema = (
//   schema: AnyZodObject | ZodEffects<AnyZodObject>
// ) => async (req: Request, res: Response, next: NextFunction) => {
//   console.log("validateSchema middleware called");

//   // Parse JSON fields safely
//   try {
//     if (req.body.links) req.body.links = JSON.parse(req.body.links);
//   } catch {
//     console.error("Invalid JSON in req.body.links");
//   }

//   try {
//     if (req.body.files) req.body.files = JSON.parse(req.body.files);
//   } catch {
//     console.error("Invalid JSON in req.body.files");
//   }

//   let filenames: string[] = [];
//   try {
//     if (req.body.filenames) {
//       filenames = JSON.parse(req.body.filenames);
//       req.body.filenames = filenames;
//     }
//   } catch {
//     console.error("Invalid JSON in req.body.filenames");
//   }

//   const allFiles = (req.files || []) as Express.Multer.File[];

//   // Attach video file
//   const videoFile = allFiles.find((file) => file.fieldname === "video");
//   if (videoFile) {
//     req.body.video = videoFile;
//   }

//   // Attach uploaded files and filenames if contentType is 'file'
//   if (req.body.contentType === "file") {
//     const uploadedFiles = allFiles.filter((file) => file.fieldname === "files");
//     const mappedFiles = assignFilenamesToFiles(uploadedFiles, filenames);
//     req.body.files = mappedFiles;
//     req.body.filenames = filenames; 
//   }

//   console.log("Parsed req.body:", req.body);
//   console.log("req.files:", req.files);

//   try {
//     const result = await schema.parseAsync(req.body);
//     req.body = result; // Attach validated data to req.body
//     next();
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const formattedErrors = error.errors.map((err) => {
//         const path = err.path.join(".");
//         let message = err.message;

//         if (err.code === "invalid_type") {
//           message = `Invalid type for ${path}: ${message}`;
//         } else if (err.code === "too_small") {
//           message = `${path} is too short: ${message}`;
//         } else if (err.code === "too_big") {
//           message = `${path} is too long: ${message}`;
//         } else if (err.code === "invalid_enum_value") {
//           message = `Invalid value for ${path}: ${message}`;
//         } else if (err.code === "invalid_union") {
//           message = `Invalid value for ${path}: ${message}`;
//         }

//         return {
//           field: path,
//           message,
//           code: err.code,
//         };
//       });

//       console.error("Validation Errors:", formattedErrors);
//       return next(new ApiError(400, "Validation Error", formattedErrors));
//     }

//     return next(error);
//   }
// };




///////////////////////

function assignFilenamesToFiles(
    files: Express.Multer.File[],
    filenames: string[]
  ) {
    return files.map((file, index) => ({
      ...file,
      customName: filenames[index] || file.originalname, // Assign string directly
    }));
  }

  export const validateSchema = (
    schema: AnyZodObject | ZodEffects<AnyZodObject>
  ) => async (req: Request, res: Response, next: NextFunction) => {
    console.log("validateSchema middleware called");
  
    // Parse JSON fields safely
    try {
      if (req.body.links) req.body.links = JSON.parse(req.body.links);
    } catch {
      console.error("Invalid JSON in req.body.links");
    }
  
    try {
      if (req.body.files) req.body.files = JSON.parse(req.body.files);
    } catch {
      console.error("Invalid JSON in req.body.files");
    }
  
    let filenames: string[] = [];
    try {
      if (req.body.filenames) {
        const parsed = JSON.parse(req.body.filenames);
        filenames = Array.isArray(parsed) ? parsed.map((item: any) => item.name || item) : [];
        req.body.filenames = filenames;
      }
    } catch {
      console.error("Invalid JSON in req.body.filenames");
    }
  
    const allFiles = (req.files || []) as Express.Multer.File[];
  
    // Attach video file
    const videoFile = allFiles.find((file) => file.fieldname === "video");
    if (videoFile) {
      console.log("videoFile--->",videoFile)
      req.body.video = videoFile;
    }
  
    // Transform files for contentType 'file' to match fileSchema
    if (req.body.contentType === "file") {
      const uploadedFiles = allFiles.filter((file) => file.fieldname === "files");
      const mappedFiles = assignFilenamesToFiles(uploadedFiles, filenames).map((file, index) => ({
        name: filenames[index] || file.originalname, // Use custom name or fallback to originalname
        url: '', // Placeholder, will be populated by uploadFiles
        public_id: undefined, // Placeholder, will be populated by uploadFiles
        type: file.mimetype, // Use mimetype from Multer
      }));
      req.body.files = mappedFiles;
      req.body.filenames = filenames;
    }
  
    console.log("Parsed req.body:", req.body);
    console.log("req.files:", req.files);
  
    try {
      const result = await schema.parseAsync(req.body);
      req.body = result; // Attach validated data to req.body
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => {
          const path = err.path.join(".");
          let message = err.message;
  
          if (err.code === "invalid_type") {
            message = `Invalid type for ${path}: ${message}`;
          } else if (err.code === "too_small") {
            message = `${path} is too short: ${message}`;
          } else if (err.code === "too_big") {
            message = `${path} is too long: ${message}`;
          } else if (err.code === "invalid_enum_value") {
            message = `Invalid value for ${path}: ${message}`;
          } else if (err.code === "invalid_union") {
            message = `Invalid value for ${path}: ${message}`;
          }
  
          return {
            field: path,
            message,
            code: err.code,
          };
        });
  
        console.error("Validation Errors:", formattedErrors);
        return next(new ApiError(400, "Validation Error", formattedErrors));
      }
  
      return next(error);
    }
  };



   