import express from 'express';
import { submitIdea } from '../../controllers/submitAnIdea';
const router = express.Router();


import { authenticateWebUser } from '../../helpers/msal';

router.use(authenticateWebUser);
router.post('/submitIdea', submitIdea);

export default router