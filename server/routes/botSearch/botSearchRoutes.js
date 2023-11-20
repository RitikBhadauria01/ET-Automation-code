import express from 'express';
import {botSearch} from '../../controllers/botSearchController'
import { authenticateWebUser } from '../../helpers/msal';
const router = express.Router();

router.use(authenticateWebUser);

router.get('/globalLocal?:botID', botSearch);

export default router;

