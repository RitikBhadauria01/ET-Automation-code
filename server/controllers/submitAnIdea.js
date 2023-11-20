import catchAsync from '../helpers/catchAsync';
import ResponseObject from '../helpers/responseObjectClass';
import SubmitAnIdea from '../models/SubmitAnIdea'

import { submitAnIdeaMailer } from './mailerController';

const submitIdea = catchAsync(async (req, res, next) => {
    // check for validations 
    console.log("Req body --", req.body);
    const { ideaProposedByMail, ideaSubmittedBy, expectedRequestorEmail } = req.body;
    if (ideaProposedByMail == '') {
        res.send(new ResponseObject(401, 'User mail missing', false, {}));
        return;
    }

    if (expectedRequestorEmail == '') {
        res.send(new ResponseObject(401, 'User mail missing', false, {}));
        return;
    }
    
    if (ideaSubmittedBy == '') {
        res.send(new ResponseObject(401, 'Name missing', false, {}));
        return;
    }
    try {
            // build 
        await SubmitAnIdea.sync();
        const createIdea = SubmitAnIdea.build(req.body);
        // save
        let ideaResponse = await createIdea.save();
        console.log('idea response ----', ideaResponse);

        let mailerObject = {
            ideaData: ideaResponse.dataValues,
            userData: req.user,
            type: "SubmitAnIdea"
        };
        await submitAnIdeaMailer(mailerObject);
          // send vaild response
        res.send(new ResponseObject(200, 'Idea Submited Submited Sucessfully', true, ideaResponse));

    } catch (e) {
        console.log(e);
        res.send(new ResponseObject(500, 'Failed to Submit Idea', false, {}));
    }
});
export default {
    submitIdea
}
