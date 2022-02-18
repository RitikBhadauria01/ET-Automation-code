import azure from 'azure-storage';
import { Buffer } from 'buffer';
import config from '../../config/env';

const base64Encoder = async (s) => {
  let buff = new Buffer.from(s);
  return await buff.toString('base64');
};
async function azureConnection(req, res) {
  let key = await base64Encoder(config.AccountKey);

  let tableSvc = azure.createTableService(config.AccountName, key);
  tableSvc.createTableIfNotExists('mytable', function (error, result, response) {
    if (!error) {
    }
  });

  res.status(200);
  res.send({ success: 'connection successful' });
}
export default {
  azureConnection,
};
