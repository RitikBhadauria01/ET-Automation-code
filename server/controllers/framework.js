import catchAsync from '../helpers/catchAsync';
import FrameWorkValdations from '../helpers/validation';
import ResponseObject from '../helpers/responseObjectClass';
import Framework from '../models/framework';
import ElasticClient from '../helpers/elasticConnection';
const createFramework = catchAsync(async (req, res, next) => {
  // check if pariticulaar user exist in the user table or not then on create the bot

  for (const prop in req.body) {
    let response = await FrameWorkValdations(req.body[prop], prop);
    if (response != true) {
      next(response);
      return;
    }
  }
  await Framework.sync();
  let frameWork = Framework.build(req.body);
  let frameworkResponse = await frameWork.save();
  console.log("frame work response  ---", frameworkResponse);
  console.log(frameworkResponse.dataValues.frameworkId);
  let indexingResposne = await ElasticClient.index({
    index: 'framework',
    id: frameworkResponse.dataValues.frameworkId,
    type: '_doc',
    body: frameworkResponse,
  });
  console.log("indexing response  ----", indexingResposne);
  res.send(new ResponseObject(200, 'Sucessfully Created Framework', true, frameworkResponse));
});
const getDocuments = catchAsync(async (req, res, next) => {
  const restrictedUser = ["endUser",
  "businessUserRegionWise",
  "businessUserRegionWise",
  "firstGfcf",
  'gfcf',
  'firstLevelGPMApprover',
  'GPMapprover',
    'gCad'];
  let filter = {};
  if (restrictedUser.includes(req.user.userType)) {
    console.log("restricted user");
    filter = {
      docCategory: "automation"
    };
  }
  await Framework.sync();
  let getFramework = await Framework.findAll({
    where:filter, 
    order: [['frameworkId', 'DESC']],
  });

  res.send(new ResponseObject(200, 'Sucessfully Found', true, getFramework));
});

const deleteDocument = catchAsync(async (req, res, next) => {
  console.log(req.query, "my query ayyy")
  await Framework.sync();
  let deleteResponse = await Framework.destroy( { where : { frameworkId : req.query.id}});
    res.send(new ResponseObject(200, 'Sucessfully deleted', true, deleteResponse));
 });


export default {
  createFramework,
  getDocuments,
  deleteDocument
};
