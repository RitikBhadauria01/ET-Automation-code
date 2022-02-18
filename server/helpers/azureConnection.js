import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import config from '../../config/env';
import path from 'path';
import fs from 'fs';
import azureStorage from 'azure-storage';

const sharedKeyCredential = new StorageSharedKeyCredential(
  config.azureAccountName,
  config.azureAccountKey
);
const blobServiceClient = new BlobServiceClient(
  `https://${config.azureAccountName}.blob.core.windows.net`,
  sharedKeyCredential
);

const blobService = azureStorage.createBlobService(config.azureAccountName, config.azureAccountKey);

const uploadLocalFile = async (containerName, filePath) =>
  new Promise((resolve, reject) => {
    const fullPath = path.resolve(__dirname, `../../../${filePath}`);
    blobService.createBlockBlobFromLocalFile(containerName, filePath, fullPath, (err, status) => {
      if (err) {
        console.log('=================uploadLocalFile===================');
        console.log(err);
        console.log('=================uploadLocalFile===================');
        reject(err);
      } else {
        resolve({ status: true, message: `Local file "${filePath}" is uploaded`, data: status });
        fs.unlink(filePath, (err) => {
          if (err) {
            console.log('================uploadLocalFile====================');
            console.log(err);
            console.log('================uploadLocalFile====================');
          } else {
            console.log('================uploadLocalFile====================');
            console.log(`file unlinked ${filePath}`);
            console.log('================uploadLocalFile====================');
          }
        });
      }
    });
  });

export default {
  blobServiceClient,
  uploadLocalFile,
};
