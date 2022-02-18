import express from 'express';

import { authenticateWebUser } from '../../helpers/msal'

import { sendMail, createMailerThroughFile ,getEl ,exportMailerData} from '../../controllers/mailerController'

const router = express.Router();


router.get('/getEngagementLead',getEl);
router.use(authenticateWebUser);

router.post('/createMailer', createMailerThroughFile);
router.post("/sendMail", sendMail);
router.get('/exportMailer', exportMailerData);
export default router;