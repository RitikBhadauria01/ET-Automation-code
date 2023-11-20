import catchAsync from '../helpers/catchAsync';
import ResponseObject from '../helpers/responseObjectClass';
import BotUser from '../models/BotUser';

const botSearch = catchAsync(async (req, res, next) => {
    let {botID} = req.query;
    const result = await BotUser.Bot.findAll({
        where: {
            botExternalId: botID,
        },
    });

    let getBotMessage = 'Suceessfully Found';
    if (result.length == 0) {
        getBotMessage = 'No Bot associated with user';
    }
    res.send(new ResponseObject(200, getBotMessage, true, result));
});

export default {
    botSearch
};

