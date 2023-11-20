import express from 'express';
import {createSkill, searchSkill, deleteSkill, getSoftSkill} from '../../controllers/softSkillController'
import { authenticateWebUser } from '../../helpers/msal';
const router = express.Router();

router.use(authenticateWebUser);

router.post('/add', createSkill);
router.get('/search?:empTwinId', searchSkill);
router.delete('/delete', deleteSkill);
router.get('/get?:softSkillID', getSoftSkill);

export default router;

