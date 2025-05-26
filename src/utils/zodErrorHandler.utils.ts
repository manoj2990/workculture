
import { z } from 'zod';
import ApiResponse from '@/utils/apiResponse.utils'; 

//check if zod validation fails and return error response
export const handleZodError = (result: z.SafeParseReturnType<any, any>, res: any) => {
    if (!result.success) { //if zod validation fails
        const { fieldErrors } = result.error.flatten();
        return new ApiResponse(400, {
            message: "Validation failed",
            errors: fieldErrors
        }).send(res);
    }
    return null; //no error, proceed to controller logic
};
