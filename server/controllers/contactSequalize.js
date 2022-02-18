import ContactUs from '../models/contactUs';
import catchAsync from '../helpers/catchAsync';
import ContactValidator from '../helpers/validation';
import ResponseObject from '../helpers/responseObjectClass';
import { contactMailer } from './mailerController'
// create or update contact
const createContact = catchAsync(async (req, res, next) => {
  let { user, body } = req;
  console.log("request Boyd  ---", req.body);
  for (const prop in req.body) {
    let response = await ContactValidator(req.body[prop], prop);
    if (response != true) {
      next(response);
      return;
    }
  }
  // handle when failed to create from sql ?
  // await ContactUs.sync();
  let concat = ContactUs.build(req.body);
  let resp = await concat.save();
  console.log("request body  ----", req.body);
  let mailerObject = {
    user: user,
    mailData: body,
    type:'Contact'
  };
  let mailerResponse =await contactMailer(mailerObject);
  console.log('mailer response  --',  mailerResponse);
  res.send(new ResponseObject(200, 'Sucessfully Created', true, resp));
});
// get all enquiry list
const getContactUs = catchAsync(async (req, res, next) => {
  let query = req.query;

  const result = await ContactUs.findAll({
    where: {
      email: query.email,
    },
  });

  let getContactMessage = 'Sucessfully found';
  if (result.length == 0) {
    getContactMessage = 'No such Enquiry';
  }

  // res.send({ data: result[0].dataValues });
  res.send(new ResponseObject(200, getContactMessage, true, result));
});
// deleteContact
const deleteContact = catchAsync(async (req, res, next) => {
  for (const prop in req.body) {
    let response = await ContactValidator(req.body[prop], prop);
    if (response != true) {
      next(response);
      return;
    }
  }
  let deleteResponse = await ContactUs.destroy({
    where: {
      email: req.body.email,
      id: req.body.id,
    },
  });

  let deleteMessage = 'Sucessfully Deleted';
  if (deleteResponse === 0) {
    deleteMessage = 'No such Equiry assciated with User';
  }
  res.send(new ResponseObject(200, deleteMessage, true, deleteResponse));
});
export default {
  createContact,
  getContactUs,
  deleteContact,
};
