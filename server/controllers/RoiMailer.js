import catchAsync from '../helpers/catchAsync';
import ResponseObject from '../helpers/responseObjectClass';
import RoiMailerForm from '../models/RoiForm';
import { roiFormMailer } from './mailerController';

const roiFormData = catchAsync(async (req, res, next) => {
  console.log('Req body --', req.body);
  // console.log("Req__Data --", req);
  const { formSubmittedBy } = req.body;
  if (formSubmittedBy == '') {
    res.send(new ResponseObject(401, 'User mail missing', false, {}));
    return;
  }
  try {
    await RoiMailerForm.sync();
    const createForm = RoiMailerForm.build(req.body);
    let formResponse = await createForm.save();
    console.log('form_response ----', formResponse);

    let mailerObject = {
      formData: formResponse.dataValues,
      userData: req.user,
      type: 'RoiMailerForm',
    };
    console.log('mailerObject:', mailerObject);
    await roiFormMailer(mailerObject);
    res.send( new ResponseObject( 200,'E-mail Sent & Data inserted in Database Successfully',true,formResponse));
  } catch (e) {
    console.log(e);
    res.send(new ResponseObject(500, `Failed to Submit Form: ${e}`, false, {}));
  }
});
export default {
  roiFormData,
};

