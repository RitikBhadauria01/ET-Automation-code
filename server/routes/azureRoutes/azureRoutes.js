import express from 'express'
import {checkAzureConnection} from '../../controllers/azureBlobStorage'

const router = express.Router();

router.get('/azureConnection', checkAzureConnection)
export default router