import express from 'express';
import { createRoiFormData, exportInExcel, checkAuthorization } from '../../controllers/roiFormNoMail';
import { roiFormData } from '../../controllers/RoiMailer';
import { authenticateWebUser } from '../../helpers/msal';
const router = express.Router();


router.use(authenticateWebUser);
router.post('/getformdata', createRoiFormData); 
router.post('/exportInExcel', exportInExcel); 
router.post('/sendformdata', roiFormData);
router.get('/checkAuthorization', checkAuthorization);

export default router
