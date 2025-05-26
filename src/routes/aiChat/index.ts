

import { Router } from 'express';
import {chatwithAI} from "@/controllers/chatController"
const router = Router({ mergeParams: true });

router.post('/',chatwithAI);


export default router; 