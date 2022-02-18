import express from 'express';

import {
    creatGetReq
} from '../../controllers/getThisBotController';
import { authenticateWebUser } from  '../../helpers/msal'
const router = express.Router();
router.use(authenticateWebUser);
router.post("/createGetReq", creatGetReq);
export default router;