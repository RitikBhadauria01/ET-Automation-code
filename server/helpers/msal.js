import config from '../../config/env';
import UserBot from '../models/BotUser';
import AppError from './AppError';
import axios from 'axios';
import catchAsync from './catchAsync';
import ResposneObject from '../helpers/responseObjectClass';

const getUserData = async (email, data) => {
  // console.log("email  ---", email);
  if (email == '') {
    return new AppError('Email is Missing', 404);
  }
  // find in database
  let response = await UserBot.User.findOne({
    where: {
      email: email,
    },
  });
  // console.log("Response  ---- fetch user  ---", response);
  let dataValues = response.dataValues;

  let message = 'Succesfully found user';
  if (!response) {
    message = 'No such user  exist';
  }
  return new ResposneObject(200, message, true, dataValues);
};
const graphApi = async (accessToken) => {
  // var headers = new Headers();
  //console.log('---------inside graph api ----');
  let graphEndpoint = 'https://graph.microsoft.com/beta/me';
  try {
    let resp = await axios.get(graphEndpoint, {
      headers: {
        Authorization: accessToken,
      },
    });
    //
    //  console.log('resposne  graph api ffffffffffffffffff-----',resp.data);
    let responseEmail = resp.data.onPremisesUserPrincipalName;
    if (responseEmail != '') {
      // find user data using email
      let userResposne = await getUserData(responseEmail, resp.data);

      return userResposne;
      // return user data
    } else {
      return new ResposneObject(401, 'User validation Failed', true, '');
    }
  } catch (e) {
    console.log('error ', e);
    return new ResposneObject(403, 'Error while authentication', false, []);
  }
};

const authenticateWebUser = catchAsync(async (req, res, next) => {
  if (!req.headers.authorization) {
    console.log('Auth failed');
    res.send(new ResposneObject(403, 'Auth Expired Login Again', false, []));
  }
  // console.log('headers ---', req.headers.authorization);
  let authEmail = req.headers.authorization.split('|');
  // console.log('auth email', authEmail[1]);
  // return;

  let byPassArray = [];
  // 'Kartik.Vij@unilever.com',
  // 'sanjay.sharma@unilever.com', 'David.Raj@unilever.com'
  let resp = '';

  if (byPassArray.includes(authEmail[1])) {
    // console.log("inside by pass array");
    resp = await getUserData(authEmail[1], {});
    //console.log('resposne  user data--', resp);
  } else {
    resp = await graphApi(authEmail[0]);
  }
  //console.log('resp ----auth  ', resp);
  if (resp.code == 403) {
    //  console.log('herer ----');
    // next(resp);
    res.send(resp);
    return;
  } else if (resp.code == 200) {
    req.user = resp.data;
    next();
  }
});
export default {
  authenticateWebUser,
};
