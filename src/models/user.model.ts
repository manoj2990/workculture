import mongoose, { Schema, model, Document } from 'mongoose';
import { IUser } from '@/types/user.types';
import RegistrationRequestModel from './registrationRequest';


  
const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false //this is used to hide the password from the response
    },

    //Review: please suggest is this is correct or not?
    //accountType of the user--> please suggest should i chage this or user have only 3 accountTypes?
    //due the used in user management page in website? accountType = manger ??
    accountType: { 
        type: String,
        enum: ['superadmin', 'admin', 'employee','individual'],
        required: true
    },

    jobTitle: {
        type: String,
        required: function () {
          return this.accountType === 'employee'; //job title is required only for employee
        }
      },
      
    createdBySuperAdmin: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' }, //if admin is created by superadmin then this field will be present

    personalInfo: { //personal info stored in personalInfo collection
        type: Schema.Types.ObjectId,
        ref: 'PersonalInfo'
    },

    created_orgs: [{ //organizations created by the admin
         type: Schema.Types.ObjectId, 
         ref: 'Organization' 
        }],

    //Review: please suggest is this is correct or not?
    adminLimits: { //limits set by the superadmin
        maxOrganizations: { type: Number, default: 0 }  ,
        maxCourses: { type: Number, default: 0 },
        maxDepartments: { type: Number, default: 0 },
        maxEmployees: { type: Number, default: 0 },
        maxEmployeesPerOrg: [{
            orgID: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
            limit: { type: Number, default: 0 }
          }],
          maxEmployeesPerCourseDefault: { type: Number, default: 5 },
          maxEmployeesPerCourse: [{
            courseID: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
            limit: { type: Number, default: 0 }
          }]
          
        // maxEmployeesPerOrg: { type: Number, default: 0 },
        // maxEmployeesPerDept: { type: Number, default: 0 },
        // maxEmployeesPerCourse: { type: Number, default: 0 }
    },

    //Review: please suggest is this is correct or not?--> is this approch correct for this?
    employeeData: { 
        organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
        department: { type: Schema.Types.ObjectId, ref: 'Department' },
        enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
        skills: [{ type: String, default: [] }] //skills that emp gained after completing the course
    
    },
    
    accountStatus: { 
        type: String,
        enum: ['active', 'inactive','blocked'],
        default: 'inactive',
        required() {
            return ['employee', 'individual', 'admin'].includes(this.accountType);
        },
    }
   
    
}, { timestamps: true });


//set acive for superadmin
userSchema.pre('save', function (next) {
    if (this.accountType === 'superadmin') {
      this.accountStatus = 'active';
    }
    next();
  });



export default model('User', userSchema); 


