import { Request, Response } from 'express';

import UserModel from '@/models/user.model';
import ApiError from '@/utils/apiError.utils';
import asyncHandler from '@/utils/asyncHandler.utils';
import ApiResponse from '@/utils/apiResponse.utils';

import mongoose, { Schema } from 'mongoose';

import AdminLimitsUtils from '@/utils/adminLimits.utils';
import { any } from 'zod';
import path from 'path';

interface AdminLimits {
    maxOrganizations: number;
    maxDepartments: number;
    maxCourses: number;
    maxEmployees: number;
    maxEmployeesPerOrg: Array<{
        orgID: mongoose.Types.ObjectId;
        limit: number;
    }>;
    maxEmployeesPerCourse: Array<{
        courseID: mongoose.Types.ObjectId;
        limit: number;
    }>;
    maxEmployeesPerCourseDefault: number;
}


//update admin limits-->done
export const updateAdminLimits = asyncHandler(async (req: Request, res: Response) => {
   
    const { newLimits, adminId } = req.body as { newLimits: Partial<AdminLimits>, adminId: string };
    const superAdminId = req.user?._id;

    console.log("entering into updateAdminLimits function--->req.body--->", req.body)
    console.log("superAdminId--->", superAdminId)
    console.log("adminId--->", adminId)
    console.log("newLimits--->", newLimits)

    if(!newLimits || !adminId) throw new ApiError(400, 'New limits and admin ID are required');

    const admin = await UserModel.findById(new mongoose.Types.ObjectId(adminId));
    if(!admin) throw new ApiError(404, 'Admin not found');

    if(admin.accountType !== 'admin' || admin.createdBySuperAdmin?.toString() !== superAdminId?.toString() || admin.createdBySuperAdmin === superAdminId){
        throw new ApiError(403, 'Unauthorized')
    };
    
    const currentLimits = await AdminLimitsUtils.getAdminLimitsAndUsage(new mongoose.Types.ObjectId(adminId));

    console.log("currentLimits--->", currentLimits)

    const numericFields = [
        'maxOrganizations',
        'maxCourses',
        'maxDepartments',
        'maxEmployees',
        'maxEmployeesPerCourseDefault'
      ] as const;
      
      for(const field of numericFields){
        if(field in newLimits && typeof newLimits[field] === 'number'){
            if (admin.adminLimits) {
                const typedField = field as keyof typeof currentLimits.AdminUsage;
                const currentUsageValue = currentLimits.AdminUsage[typedField];
                if(typeof currentUsageValue === 'number' && newLimits[field] < currentUsageValue){
                    throw new ApiError(400, `Cannot set ${field} to ${newLimits[field]} as current usage is ${currentUsageValue}`);
                }
                admin.adminLimits[field] = newLimits[field] as number;
            }
        }
      }



      //now handle the array fields --> maxEmployeesPerOrg
     if(Array.isArray(newLimits.maxEmployeesPerOrg)){
        
        for(const org of newLimits.maxEmployeesPerOrg){ 
            const {orgID, limit} = org;
            console.log("orgID + limit-->",orgID," ",limit)
            const currentUsageValue = currentLimits.AdminUsage.maxEmployeesPerOrg.find(o => o?.orgID?.equals(orgID))?.limit;
            if(currentUsageValue && currentUsageValue > limit){
                throw new ApiError(400, `Cannot set maxEmployeesPerOrg for org ${orgID} to ${limit} as current usage is ${currentUsageValue}`);
            }

            console.log("currentUsageValue-->",currentUsageValue)
            
            const result = admin.adminLimits?.maxEmployeesPerOrg.find(o => o?.orgID?.toString() === orgID?.toString());
            if(result){
                console.log("result-->",result)
                result.limit = limit;
            }else{
                console.log("push new maxEmployeesPerOrg")
                admin.adminLimits?.maxEmployeesPerOrg.push({orgID: new mongoose.Types.ObjectId(orgID.toString()), limit});
                
            }
        }
     }


     //now handle the array fields --> maxEmployeesPerCourse
     if(Array.isArray(newLimits.maxEmployeesPerCourse)){
        for(const course of newLimits.maxEmployeesPerCourse){
            const {courseID, limit} = course;
            const currentUsageValue = currentLimits.AdminUsage.maxEmployeesPerCourse.find( c => c.courseID.toString() === courseID.toString())?.limit;
            if(currentUsageValue && currentUsageValue > limit){
                throw new ApiError(400, `Cannot set maxEmployeesPerCourse for course ${courseID} to ${limit} as current usage is ${currentUsageValue}`);
            }

            const result = admin.adminLimits?.maxEmployeesPerCourse.find(c => c?.courseID?.toString() === courseID?.toString());
            if(result){
                result.limit = limit;
            }else{
                // admin.adminLimits?.maxEmployeesPerCourse.push({courseID: new Schema.Types.ObjectId(courseID.toString()), limit});
                admin.adminLimits?.maxEmployeesPerCourse.push({courseID: new mongoose.Types.ObjectId(courseID.toString()), limit});
            }
        }
        
     }

     //save the admin
     await admin.save();

     return new ApiResponse(200, {
        message: 'Admin limits updated successfully'
     }).send(res);      

});






// Get All Admins --> done
export const getAllAdmins = asyncHandler(async (req: Request, res: Response) => {
    
    if(!req.user){
        throw new ApiError(401, 'Unauthorized');
    }

    if(req.user?.accountType !== 'superadmin'){
        throw new ApiError(403, 'Only superadmin can get all admins');
    }

    const admins = await UserModel.find({
        accountType: 'admin',
        createdBySuperAdmin: req.user?._id
    }).populate({
        path: 'created_orgs', 
        select: '_id name',   
        populate: {
            path: 'departments', 
            select: '_id name' ,
            populate:{
                path: 'courses',
                select: '_id'
            }
        },
        
    }).select('-password').lean();

    if(!admins){
        throw new ApiError(404, 'No admins found');
    }

const Alladmins = [...admins]
console.log("sneding all admins ---->",Alladmins)


return new ApiResponse(200, Alladmins).send(res);
 

    // return new ApiResponse(200, {
    //     ...Alladmins,
    //     count: admins.length
    // }).send(res);
});



// Get Admin by ID --> done
export const getAdminById = asyncHandler(async (req: Request, res: Response) => {

    //get admin id from params
    const { adminId : id} = req.body;

    //Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid admin ID");
    }

    //check if user is authenticated
    if(!req.user){
        throw new ApiError(401, 'Unauthorized');
    }

    //check if user is superadmin
    if(req.user?.accountType !== 'superadmin'){
        throw new ApiError(403, 'Only superadmin can get admin by id');
    }

    //get admin --> jiski id ==asdmin -->accountType = admin -->createdBySuperAdmin = req.user?._id
    const admin = await UserModel.findOne({
        _id: id,
        accountType: 'admin',
        createdBySuperAdmin: req.user?._id
    }).select('-password').lean()
    .populate([{ path: "personalInfo" }]).lean()

    if (!admin) {
        throw new ApiError(404, 'Admin not found');
    }

    return new ApiResponse(200, admin).send(res);
});



// Update Admin Information->done
export const updateAdminInformation = asyncHandler(async (req: Request, res: Response) => {
    
    const {adminId} = req.body;
   

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new ApiError(400, "Invalid admin ID");
    }

    //check if user is authenticated
    if(!req.user){
        throw new ApiError(401, 'Unauthorized');
    }
    
  
    const updateData: any = {};
  
    // Update basic info if provided
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if(req.body.accountStatus){
        if(req.body.accountStatus == 'active') updateData.accountStatus = req.body.accountStatus ;
        if(req.body.accountStatus == 'inactive') updateData.accountStatus = req.body.accountStatus ;
    }
  
    

    // Perform the update
    const updatedAdmin = await UserModel.findOneAndUpdate(
      {
        _id: adminId,
        accountType: 'admin',
        createdBySuperAdmin: req.user?._id 
      },
      updateData,
      { new: true }
    ).select('-password').lean(); 
  
    
    if (!updatedAdmin) {
      throw new ApiError(404, "Admin not found");
    }
  

    return new ApiResponse(200, {
      admin: updatedAdmin,
      message: "Admin updated successfully"
    }).send(res);
  });



// >>>>>>>>>>>>>>Delete Admin--> need to delete all departments,courses,users,organization
export const deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
    
    const { id } = req.params;

    //Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid admin ID");
    }

    //check if user is authenticated
    if(!req.user){
        throw new ApiError(401, 'Unauthorized');
    }

    //check if user is superadmin
    if(req.user?.accountType !== 'superadmin' && req.user?.accountType !== 'admin'){
        throw new ApiError(403, 'Only superadmin and admin can delete admin');
    }

    if(!id){
        throw new ApiError(400, 'Admin ID is required');
    }

    const admin = await UserModel.findOneAndDelete({
        _id: id,
        accountType: 'admin',
        createdBySuperAdmin: req.user?._id
    });

    if (!admin) {
        throw new ApiError(404, 'Admin not found');
    }

    return new ApiResponse(200, {
        message: 'Admin deleted successfully'
    }).send(res);
}); 






