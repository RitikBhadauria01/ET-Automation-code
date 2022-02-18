import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import config from '../../config/env';
import multer from 'multer';
import azureMulter from 'multer-azure';
import express from 'express';

const base64Encoder = async (s) => {
  let buff = new Buffer.from(s);
  return await buff.toString('base64');
};

async function storeUsingMulter(request, res) {
  let app = express();

  //
  let key = await base64Encoder(config.AccountKey);
  let uplaod = multer({
    storage: azureMulter({
      account: config.AccountName,
      key: key,
      container: 'botstorevideo',
      blobPathResolver: function (req, file, callback) {
        // var blobPath = yourMagicLogic(req, file);
      },
    }),
  });

  app.post('/', uplaod.any(), function (request, res, next) {
    res.status(200).send('Uploaded: ' + req.body.files);
  });

  //
}
export default {
  storeUsingMulter,
};
