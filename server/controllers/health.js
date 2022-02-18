import catchAsync from '../helpers/catchAsync';
import responseObjectClass from '../objects/responseObjectClass';

const newResponseObject = new responseObjectClass();

const checkConnection = catchAsync(async (req, res, next) => {
  console.log("working");
  const returnObj = newResponseObject.generateResponseObject({
    code: 200,
    success: true,
    message: 'Utility Service, health is in working state :)',
  });
  res.send(returnObj);
})

export default {
  checkConnection,
};
