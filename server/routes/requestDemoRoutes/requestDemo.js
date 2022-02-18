import express from 'express';
import {createDemoRequest} from '../../controllers/requestDemo';
const router = express.Router();
import { authenticateWebUser } from '../../helpers/msal'

router.use(authenticateWebUser);
router.post('/createDemoRequest', createDemoRequest);

export default router