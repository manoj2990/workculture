import ApiError from "./apiError.utils";

// /utils/azureBlob.js
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

//blob service se connection stablised kr rha hai
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
//specific container to access kr rha hai
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Upload File
export async function uploadToAzure(fileBuffer:any, originalName:any, mimeType:any) {

    try {

        const newFileName = `${uuidv4()}_${originalName}`;
        const blockBlobClient = containerClient.getBlockBlobClient(newFileName); // get refference of file

    await blockBlobClient.uploadData(fileBuffer, { //uplode file to azure
        blobHTTPHeaders: { blobContentType: mimeType } 
    });

    const cdnUrl = `${process.env.CDN_URL}/${newFileName}`; //create cdn url
    return { cdnUrl, blobName: newFileName };
    } catch (error) {
        console.error(error);
        throw new ApiError(500, 'Failed to upload file to Azure');
    }
}



// Delete File
export async function deleteFromAzure(blobName:any) {
    try {
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.deleteIfExists();

        return true;
    } catch (error) {
        console.error(error);
        throw new ApiError(500, 'Failed to delete file from Azure');
    }
}

// Replace File (Delete old + upload new)
export async function replaceFileInAzure(oldBlobName:any, newFileBuffer:any, newOriginalName:any, mimeType:any) {
    try {
        await deleteFromAzure(oldBlobName);
        const { cdnUrl, blobName } = await uploadToAzure(newFileBuffer, newOriginalName, mimeType);
        return { cdnUrl, blobName };
    } catch (error) {
        console.error(error);
        throw new ApiError(500, 'Failed to replace file in Azure');
    }
}


