import catchAsync from '../helpers/catchAsync';
import ResponseObject from '../helpers/responseObjectClass';
import GetThisBot from '../models/GetThisBot';

import { getThisBotMailer } from './mailerController';


const creatGetReq = catchAsync(async (req, res, next) => {
  let { user, body } = req;
  console.log("Req user ---", req.user);
  console.log('req body ---', req.body);
    await GetThisBot.GetThisBot.sync();
    const resp =  GetThisBot.GetThisBot.build(req.body);
  const response = await resp.save();
  let mailerObject = {
    user: user,
    mailData: body,
    requestType:'Bot Request'
  };
  const mailerResponse = getThisBotMailer(mailerObject);
 // console.log('mailer resposne  ----', mailerResponse);
    res.send(new ResponseObject(200, "Get request created", true,response));
})
export default {
    creatGetReq
}