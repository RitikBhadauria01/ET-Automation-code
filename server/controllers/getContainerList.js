import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import config from '../../config/env';

const base64Encoder = async (s) => {
  let buff = new Buffer.from(s);
  return await buff.toString('base64');
};

async function azureBlobConnection(req, res) {
  let key = await base64Encoder(config.AccountKey);

  const sharedKeyCredential = new StorageSharedKeyCredential(config.AccountName, key);
  const blobServiceClient = new BlobServiceClient(
    `https://${config.AccountName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  let i = 1;
  let containers = blobServiceClient.listContainers();
  for await (const container of containers) {
  }

  res.status(200);
  res.send({ success: 'connection successful' });
}
export default {
  azureBlobConnection,
};
