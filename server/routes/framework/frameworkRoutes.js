import express from 'express';
import {
    createFramework,
   // updateFramework
//   updateFramework,
//   deleteFramework,
    getDocuments,
    deleteDocument
} from '../../controllers/framework';
import { authenticateWebUser } from  '../../helpers/msal'
const router = express.Router();
router.use(authenticateWebUser);
router.post('/createFramework', createFramework);
//router.put('/updateFramework', updateFramework);
// get user
 router.get('/getFramework', getDocuments);
// router.put('/updateFrameWork', updateFramework);
// // delete users
router.delete('/deleteFrameworkDocument',deleteDocument);
export default router;
