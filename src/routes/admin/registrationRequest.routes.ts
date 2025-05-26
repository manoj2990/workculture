
import express from 'express';
import {  isAdmin } from '@/middlewares/role.middleware';
import { auth } from '@/middlewares/auth.middlewares';
import { getallRegistrationRequests, 
    handleRegistrationRequest ,
    updateSingleRegistrationRequest
} from '@/controllers/registrationRequest.controller';


const router = express.Router({mergeParams: true});


//get all registration req from user
router.post('/get', // testing done
    auth,
    isAdmin,
    getallRegistrationRequests
)




//handle bulk registration req
router.post('/handle', // testing done
    auth,
    isAdmin,
    handleRegistrationRequest
)



//update single registration req
router.post('/singleUpdate', // testing done
    auth,
    isAdmin,
    updateSingleRegistrationRequest
)


export default router;

