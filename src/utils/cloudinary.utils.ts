import { v2 as cloudinary } from 'cloudinary';
import ApiError from './apiError.utils';
import { cloudinaryConnect } from '@/config/cloudinary.config';

// Initialize Cloudinary connection
cloudinaryConnect();

// interface FileUploadResult {
//     url: string;
//     public_id: string;
// }


// interface CloudinaryUploadResponse {
//     secure_url: string;
//     public_id: string;
// }



// /**
//  * Uploads a file to Cloudinary
//  * @param file - File path, buffer, or object with path/tempFilePath
//  * @param type - Type of file ('video', 'pdf', 'image', 'doc')
//  * @returns Promise<FileUploadResult> - Upload result with URL and public ID
//  */
// export const uploadOnCloudinary = async (
//     file: string | { tempFilePath: string } | { path: string } | Buffer,
//     type: 'video' | 'pdf' | 'image' | 'doc' | 'file' | 'audio'
// ): Promise<FileUploadResult> => {
//     console.log("📤 Starting Cloudinary upload...");
//     console.log("📁 File type:", typeof file);
    
//     try {
//         // Get file path or buffer
//         let uploadOptions: any = {
//             resource_type: type === 'video' ? 'video' : 'auto',
//             folder: 'skillsparc'
//         };

//         let result: CloudinaryUploadResponse;
//         if (typeof file === 'string') {
//             console.log("📁 Uploading from file path:", file);
//             result = await cloudinary.uploader.upload(file, uploadOptions) as CloudinaryUploadResponse;
//         } else if (Buffer.isBuffer(file)) {
//             console.log("📁 Uploading from buffer");
//             result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
//                 const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
//                     if (error) reject(error);
//                     else resolve(result as CloudinaryUploadResponse);
//                 });
//                 uploadStream.end(file);
//             });
//         } else {
//             const filePath = (file as any).path || (file as any).tempFilePath;
//             console.log("📁 Uploading from object with path:", filePath);
//             result = await cloudinary.uploader.upload(filePath, uploadOptions) as CloudinaryUploadResponse;
//         }

//         console.log("✅ Upload successful:", result);
//         return {
//             url: result.secure_url,
//             public_id: result.public_id
//         };
//     } catch (error: any) {
//         console.error("❌ Upload failed:", error);
//         throw new ApiError(500, `Failed to upload ${type}: ${error.message}`);
//     }
// };



/////////////////new logic with audio biffer save/////////////////



interface FileUploadResult {
  url: string;
  public_id: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

export const uploadOnCloudinary = async (
  file: string | { tempFilePath: string } | { path: string } | Buffer,
  type: 'video' | 'pdf' | 'image' | 'doc' | 'file' | 'audio',
  folder: string = 'skillsparc'
): Promise<FileUploadResult> => {
  console.log("📤 Starting Cloudinary upload...");
  console.log("📁 File type:", typeof file, "Upload type:", type);

  try {
    // Set upload options
    const uploadOptions: any = {
      resource_type: type === 'audio' || type === 'video' ? 'video' : 'auto',
      folder,
    };

    // Ensure MP3 format for audio
    if (type === 'audio') {
      uploadOptions.format = 'mp3';
    }

    let result: CloudinaryUploadResponse;
    if (typeof file === 'string') {
      console.log("📁 Uploading from file path:", file);
      result = await cloudinary.uploader.upload(file, uploadOptions) as CloudinaryUploadResponse;
    } else if (Buffer.isBuffer(file)) {
      console.log("📁 Uploading from buffer");
      result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResponse);
        });
        uploadStream.end(file);
      });
    } else {
      const filePath = (file as any).path || (file as any).tempFilePath;
      console.log("📁 Uploading from object with path:", filePath);
      result = await cloudinary.uploader.upload(filePath, uploadOptions) as CloudinaryUploadResponse;
    }

    console.log("✅ Upload successful:", result);
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error: any) {
    console.error("❌ Upload failed:", error);
    throw new ApiError(500, `Failed to upload ${type}: ${error.message}`);
  }
};







/**
 * Deletes a file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @returns Promise<void>
 */


export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
    try {
        if (!publicId) {
            throw new ApiError(400, 'Public ID is required');
        }
        const r= await cloudinary.uploader.destroy(publicId);
        console.log("deleted from cloudinary", r)
        return r;
    } catch (error) {
        console.error('Failed to delete file:', error);
        throw new ApiError(500, 'Failed to delete file');
    }
}; 