import express from 'express';
const router = express.Router();
import {loginVerify} from '../../controllers/msalLogin'
router.post('/verifyLogin', loginVerify);
export default router