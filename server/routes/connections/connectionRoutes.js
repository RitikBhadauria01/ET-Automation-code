import express from 'express';
import healthCtrl from '../../controllers/health';
import azureDbConnection from '../../controllers/azureDbConnection';
import elasticConnection from '../../controllers/elasticConnection';
import azureBlobStorage from '../../controllers/azureBlobStorage';
import getContainer from '../../controllers/getContainerList';
import blobStorage from '../../controllers/azureBlobStorage';
import SQL from '../../controllers/sqlConnection';


const router = express.Router();


// health check 
router.get('/health-check', healthCtrl.checkConnection);
// azure db connection
router.get('/azureDbConnection', azureDbConnection.azureConnection);
// elastic connection
router.get('/elasticConnection', elasticConnection.elastic);
// blob connection
//router.post('/blobConnection', azureBlobStorage.azureBlobConnection);
//  container list
router.get('/containerList', getContainer.azureBlobConnection);
// blob storage
//router.post('/blobStorage',blobStorage.azureBlobConnection);
//sql connection
router.get('/sql', SQL.getConnection);



export default router;
