import { uploadOnCloudinary, deleteFromCloudinary } from '@/utils/cloudinary.utils';
import fs from 'fs';
import ApiError from './apiError.utils';
// import { replaceFileInAzure, deleteFromAzure, uploadToAzure } from './uploadToAzure';
// ,videoName:string
export async function uploadFiles(files:any[], contentType: string, videoName:string, filenames:any[]) {
 
    const publicIds:string[] = [];

    if (contentType === 'video') {

        if (!files || !Array.isArray(files) || files.length === 0) {
            throw new ApiError(400, 'Video file is required');
        }

        const videoFile = files[0];
        const uploadResult = await uploadOnCloudinary(videoFile.path, 'video');
        // const azureUploadResult = await uploadToAzure(videoFile.buffer, videoFile.originalname, videoFile.mimetype);
        publicIds.push(uploadResult?.public_id);

        if (fs.existsSync(videoFile.path)) fs.unlinkSync(videoFile.path);

        return { 
            uploadedFiles: {
                video: {
                    name:videoFile.originalname || videoName, 
                    url: uploadResult?.url,
                    public_id: uploadResult?.public_id,
                }
            },
            publicIds
        };
    } 
    
    // if (contentType === 'file') {
        
    //     if (!files || !Array.isArray(files) || files.length === 0) {
    //         throw new ApiError(400, 'At least one file is required');
    //     }

    //     let fileNames:any[] = [];

    //     if (filesNames) {
    //         if (Array.isArray(filesNames)) {
    //             fileNames = filesNames;
    //         } else if (typeof filesNames === 'string') {
    //             try {
    //                 fileNames = JSON.parse(filesNames);
    //             } catch (error) {
    //                         console.error("Failed to parse 'files' from body", error);
    //                         throw new ApiError(400, 'Invalid files format');
    //                     }
    //                 } else {
    //                     throw new ApiError(400, 'Invalid files format');
    //                 }
    //             }

               
    //     const uploads = await Promise.all(files.map(async (file: any, index: number) => {

    //         const result = await uploadOnCloudinary(file.path, 'file');
    //         // const azureUploadResult = await uploadToAzure(file.buffer, file.originalname, file.mimetype);
    //         publicIds.push(result?.public_id);

    //         if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
           
           
    //         return {
    //             name: fileNames[index].name || file.originalname,
    //             url: result?.url,
    //             public_id: result?.public_id,
    //             type: file.mimetype
    //         };
    //     }));

        
    //     return { 
    //         uploadedFiles: { files: uploads },
    //         publicIds
    //     };
    // }



    if (contentType === 'file') {
        if (!files || !Array.isArray(files) || files.length === 0) {
          throw new ApiError(400, 'At least one file is required');
        }
    
        const publicIds: string[] = [];
    
        const uploads = await Promise.all(
          files.map(async (file: any, index: number) => {
            const result = await uploadOnCloudinary(file.path, 'file');
            publicIds.push(result?.public_id);
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            
            const customname = filenames[index]?.name

            return {
              name: customname || file.originalname, // Use custom name if available
              url: result?.url,
              public_id: result?.public_id,
              type: file.mimetype,
            };
          })
        );
    
        return {
          uploadedFiles: { files: uploads },
          publicIds,
        };
      }




    if (contentType === 'text') {
        console.log("inside uplode Fle--->",files)
        if (!files || !Array.isArray(files) || files.length === 0) {
            return
        }

        const imageFile = files[0];
        console.log("imageFile-->",imageFile)
        const uploadResult = await uploadOnCloudinary(imageFile.path, 'image');
        // const azureUploadResult = await uploadToAzure(videoFile.buffer, videoFile.originalname, videoFile.mimetype);
        publicIds.push(uploadResult?.public_id);

        if (fs.existsSync(imageFile.path)) fs.unlinkSync(imageFile.path);
        console.log("uploadResult-->",uploadResult)
        console.log("returning from uplode file.....")
        return { 
            uploadedFiles: {
                image: {
                    name: imageFile.originalname,
                    url: uploadResult?.url,
                    public_id: uploadResult?.public_id,
                }
            },
            publicIds
        };
    } 


    return { uploadedFiles: {}, publicIds: [] };
}











// export async function uploadFiles(files: any[], contentType: string, filenames:any){
//     interface UploadResult {
//       uploadedFiles: { files: any[] };
//       publicIds: string[];
//     }
  
//     if (contentType === 'file') {
//       if (!files || !Array.isArray(files) || files.length === 0) {
//         throw new ApiError(400, 'At least one file is required');
//       }
  
//       const publicIds: string[] = [];
  
//       const uploads = await Promise.all(
//         files.map(async (file: any, index: number) => {
//           const result = await uploadOnCloudinary(file.path, 'file');
//           publicIds.push(result?.public_id);
//           if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          
//           console.log("filenames[index] -->",filenames[index])
//           const customname = filenames[index].name
//           console.log("customname-->",customname)
//           return {
//             name: customname || file.originalname, // Use custom name if available
//             url: result?.url,
//             public_id: result?.public_id,
//             type: file.mimetype,
//           };
//         })
//       );
  
//       return {
//         uploadedFiles: { files: uploads },
//         publicIds,
//       };
//     }
  
//     return {
//       uploadedFiles: { files: [] },
//       publicIds: [],
//     };
//   }



export async function cleanUpUploads(publicIds: string[], files: any[]) {
    if (publicIds.length > 0) {
        await Promise.all(publicIds.map( async (public_id) => {
            try {
                await deleteFromCloudinary(public_id);
                // await deleteFromAzure(public_id);
            } catch (deleteError) {
                console.error(`Failed to delete Cloudinary file: ${public_id}`, deleteError);
            }
        }));
    }

    files.forEach((file: any) => {
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    });
}



export const replaceFile = async (req:any, res:any) => {
    try {
        const { oldBlobName } = req.body;
        const file = req.file;

        if (!oldBlobName || !file) {
            return res.status(400).json({ message: 'Required data missing' });
        }

        // const { cdnUrl, blobName } = await replaceFileInAzure(oldBlobName, file.buffer, file.originalname, file.mimetype);
        res.status(200).json({ message: 'File replaced successfully', url: 'cdnUrl', blobName: 'blobName' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'File replace failed' });
    }
};