import catchAsync from '../helpers/catchAsync';

import LoginValidations from '../helpers/validation';
import ResponseObject from '../helpers/responseObjectClass';
import AppError from '../helpers/AppError';
import axios from 'axios';
import UserBot from '../models/BotUser';

const getUserData = async (email, data) => {
  console.log("Data  ---", data);
  console.log("4");
  //console.log('email from graph api  -----', email);
  //console.log('data from msal ---', data);
  if (email == '') {
    return new AppError('Email is Missing', 404);
  }
console.log("abhi " +email);
  // find in database
  let response = await UserBot.User.findAll({
    where: {
      email: email,
    },
  });
  console.log("response  ----", response);
  console.log('5');
  if (response.length == 0) {
   // console.log("6");
   console.log("this is the data that I need", data)
    await UserBot.User.sync();
    let userTableResposne = UserBot.User.build({
      email: email,
      userType: 'endUser',
      name : data.displayName && data.displayName.length >0 ?  data.displayName.split(',')[1] +" "+ data.displayName.split(',')[0] : email,
    //  name:`${data.givenName} ${data.surname}`,
    });
    let resp = await userTableResposne.save();
   // console.log("7");
    //console.log('resp  data  values ------', resp.dataValues);
    //console.log("8");
    
    return resp.dataValues;
    
  } else {
    // update and fetch and return
  // --------------update[1];
   // console.log('ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd');
    //console.log("Here in user login admin careated or comma" ,response[0].dataValues.name);
     await UserBot.User.update({ name: data.displayName && data.displayName.length >0 ?  data.displayName.split(',')[1] +" "+ data.displayName.split(',')[0] : email }, {
      where: {
        email:email
      }
    });
  //  console.log("Update user --", updateUser);

  //console.log('else case if user is there ');
  //console.log("9");
  let responseUpdate = await UserBot.User.findAll({
    where: {
      email: email,
    },
    });
  let dataValues = responseUpdate[0].dataValues;
 // console.log("11");
    return dataValues;
  }
  let dataValues = response[0].dataValues;
  //console.log("10");
  return dataValues;
};
const graphApi = async (accessToken) => {
 // console.log("2");
  let graphEndpoint = 'https://graph.microsoft.com/beta/me';
  let resp = await axios.get(graphEndpoint, {
    headers: {
      Authorization: accessToken,
    },
  });
 // console.log("3");
  let responseEmail = resp.data.onPremisesUserPrincipalName;
 // console.log("3");
  // console.log('response graph api  ---', resp.data.onPremisesUserPrincipalName);

  if (responseEmail != '') {
    // find user data using email
   // console.log("10 -- fetch user response");
    let userResposne = await getUserData(responseEmail, resp.data);
   // console.log('10 -- fetch user response');
   // console.log("user response  ----", userResposne);
    return userResposne;
    // return user data
  } else {
    return new ResponseObject(401, 'User validation Failed', true, '');
  }
};

const loginVerify = catchAsync(async (req, res, next) => {
  let token = req.headers.authorization;
 // console.log("headers", token);
  
 // console.log("1");
  let response = await graphApi(req.headers.authorization);
 // console.log("15 end");
  if (response != null) {
    response['accessToken'] = token;

    res.send(new ResponseObject(200, 'Login Sucuessful', true, response));
  } else {
    res.send(new ResponseObject(500, 'Login Failed', false));
  }
  // console.log('resposne  login verify api---', response);
});
export default {
  loginVerify,
};
