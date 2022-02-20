import express from 'express';
import {
  createBot,
  editBot,
  deleteBot,
  getBotCount,
  getBot,
  getAssocitaion,
  getAll,
  botFilter,
  getBotDetails,
  getBotUsingId,
  exportAllBots,
  approveBot,
  getBotsForApproval,
  dataMigration,
  exportAllBotsApproval,
  indexalldata,
  addFolderName,
  editDocumentLink
} from '../../controllers/botController';

import { authenticateWebUser } from '../../helpers/msal';

const router = express.Router();
// create
router.get('/getBotDetails', getBotDetails);
router.post('/dataMigration', dataMigration);
router.get('/indexData', indexalldata);



router.use(authenticateWebUser);

router.post('/createBot', createBot);
// edit
router.put('/editBot', editBot);
// get
router.get('/getBot', getBot);
// delete
router.delete('/deleteBot', deleteBot);
// get assosciation
router.get('/getAssociation', getAssocitaion);
router.get('/getAllBots', getAll);
router.get('/botFilter', botFilter);
router.get('/getBotsInExcel', exportAllBots);
router.get('/getBotsInExcelApprover', exportAllBotsApproval)
router.put('/approveBot', approveBot);
router.get('/getBotUsingId', getBotUsingId);
router.get('/getBotsForApproval', getBotsForApproval);
router.post('/addFolderName', addFolderName)
router.post("/getBotCount", getBotCount);
router.put('/editDocumentLink', editDocumentLink)



//getBotsForApproval
export default router;
