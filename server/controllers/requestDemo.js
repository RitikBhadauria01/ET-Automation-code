
import catchAsync from '../helpers/catchAsync';

import RequestDemo from '../models/requestDemo';

import DemoValidations from '../helpers/validation';

import ResponseObject from '../helpers/responseObjectClass';


import {getThisBotMailer} from './mailerController'


const createDemoRequest = catchAsync(async (req, res, next) => {
  let { user, body } = req;
  for (const prop in req.body) {
    let response = await DemoValidations(req.body[prop], prop);
    if (response != true) {
      next(response);
      return;
    }
  }
  try{
    await RequestDemo.sync();
  let demoRequestResponse = RequestDemo.build(req.body);
  let resp = await demoRequestResponse.save();
  console.log("request a demo save  ---", resp);
  console.log("Respoonse request a demo ---", resp);
  let mailerObject = {
    user: user,
    mailData: body,
    requestType:'Automation Demo'
  };
 const mailerResponse =  getThisBotMailer(mailerObject);
 //console.log("mailer response ---", mailerResponse);
  res.send(new ResponseObject(200, 'Successful', true, resp));
  } catch (e) {
    console.log(e);
    res.send(new ResponseObject(400, 'failed',false, {}));
  }
});
export default {
  createDemoRequest,
};
