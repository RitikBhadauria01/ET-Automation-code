import express from 'express';

//../controllers/contactSequalize
import ContactUs from '../../controllers/contactSequalize';

import { authenticateWebUser } from '../../helpers/msal'



const router = express.Router();
router.use(authenticateWebUser);

router.use(authenticateWebUser);


router.post('/createContact',ContactUs.createContact);
router.get('/getContact',ContactUs.getContactUs);
router.delete('/deleteContact',ContactUs.deleteContact);

export default router