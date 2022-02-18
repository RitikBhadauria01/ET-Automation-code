import { blobServiceClient } from '../helpers/azureConnection';
import catchAsync from '../helpers/catchAsync';
import AzureValidator from '../helpers/validation';
import ResponseObject from '../helpers/responseObjectClass';

const checkAzureConnection = catchAsync(async (req, res, next) => {
  res.send(new ResponseObject(200, 'Sucessfully Connected', true));
});
export default {
  checkAzureConnection,
};
