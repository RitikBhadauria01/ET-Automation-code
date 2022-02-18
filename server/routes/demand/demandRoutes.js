import express from 'express';
const router = express.Router();
import {
  createDemand,
  getDemandData,
  updateDemandData,
  deleteDemandData,
  getAllDemand,
  createDemandThroughFile,
  demandFilter,
  getDemandFile,
  getDemandSampleFile
} from '../../controllers/demandControllers';
import { authenticateWebUser } from '../../helpers/msal'
router.use(authenticateWebUser);

router.get('/demandSampleFile', getDemandSampleFile);

router.post('/createDemand', createDemand);
router.get('/getDemand', getDemandData);
router.get('/getAllDemand', getAllDemand);
router.put('/updateDemand', updateDemandData);
// convert to patch
router.delete('/deleteDemand', deleteDemandData);

router.post('/createDemandExcel', createDemandThroughFile);
router.get('/demandFilter', demandFilter);
router.get('/getDemandFile', getDemandFile);

export default router;
