import express from 'express';
const router = express.Router();

import { createGfcf, getGfcfData ,exportGfcfData} from '../../controllers/gfcfController'
import { authenticateWebUser } from '../../helpers/msal'
router.use(authenticateWebUser);
router.post('/createGfcf', createGfcf);
router.get('/getGfcf', getGfcfData);
router.get('/exportGfcf',exportGfcfData);
export default router;