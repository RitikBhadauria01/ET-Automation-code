import catchAsync from '../helpers/catchAsync';
import UserValidations from '../helpers/validation';
import AppError from '../helpers/AppError';
import { Op, where } from 'sequelize';

//import User from '../models/User'

import UserBot from '../models/BotUser';
import ResponseObject from '../helpers/responseObjectClass';
import BotUser from '../models/BotUser';
// create user  creates table also if there is no table

// create bunsinness owner

const createBusinnesOwner = catchAsync(async (req, res, next) => {
  // find if exist other enduer then failure response
  let { email } = req.body;

  console.log('req body ', req.body);
  let findBo = await BotUser.User.findByPk(email);
  console.log('Find bo ---', findBo);
  if (findBo == null) {
    // create Bot
    console.log('here inside  ---create bo');
    await BotUser.User.sync();
    let cb = BotUser.User.build({ name: 'AdminCreated', email: email, userType: 'businessOwner' });
    const cbResponse = await cb.save();
    console.log('cb response ', cbResponse);
    res.send(new ResponseObject(200, 'Bo Created', true, cbResponse));
    return;
  } else if (findBo != null && findBo.dataValues.userType == 'endUser') {
    // update to bot

    await BotUser.User.sync();
    let updateToCb = await BotUser.User.update(
      { userType: 'businessOwner' },
      {
        where: {
          email: email,
        },
      }
    );
    console.log('Update to cb', updateToCb);
    res.send(new ResponseObject((200, 'Bo Updated', true, updateToCb)));
    return;
  } else if (findBo != null && findBo.dataValues.userType == 'businessOwner') {
    // businner owner already exist with different user type
    res.send(new ResponseObject(200, 'Can Proced to create the Bot', true, {}));
    return;
  } else {
    console.log('here anothert user type');
    res.send(
      new ResponseObject(401, 'Business owner already exist with another user type', false, {})
    );
  }
});
//for admin user only
const createUsers = catchAsync(async (req, res, next) => {
  // only admin can create any user
  if (req.user.userType != 'admin') {
    next(new ResponseObject(404, 'Unauthorized', false, {}));
    return;
  }
  // console.log("dummmy usere ----", req.body);
  if (req.body.email == '') {
    console.log('');
    res.send(new ResponseObject(401, "Email can't be Empty", false, {}));
    return;
  }
  console.log('request body  ----', req.body);
  console.log('user type', req.body.userType.length);
  // validation request body
  for (const prop in req.body) {
    if (prop == 'name' || prop == 'email') {
      let response = await UserValidations(req.body[prop], prop);
      if (response != true) {
        next(response);
        return;
      }
    }
  }
  // check user if already exist then proceed
  let getUserResponse = await UserBot.User.findByPk(req.body.email);
  if (getUserResponse == null) {
    let userType = req.body.userType;
    if (userType == 'firstGfcf' || userType == "gfcf") {
      let getUserByType = await BotUser.User.findOne({
        where: {
          [Op.and]: [{ userType: userType }, { mco: req.body.mco }, { cluster: req.body.cluster }],
        },
      });
      if (getUserByType == null) {
        await UserBot.User.sync();
        let userTableResposne = UserBot.User.build(req.body);
        let resp = await userTableResposne.save();
        res.send(new ResponseObject(200, 'Suceesfuuly Created', true, resp));
      }  else {
        res.send(
          new ResponseObject(
            401,
            `User can't be created because such usertype already exists for mco ${req.body.mco} and  cluster ${req.body.cluster}`,
            true,
            {}
          )
        );
      }
    } 
    
    if (userType == 'firstLevelGPMApprover'  || userType == "GPMapprover") {
      let getUserByType = await BotUser.User.findOne({
        where: {
          [Op.and]: [{ userType: userType }, { leadPlatform: req.body.leadPlatform }, { area: req.body.area }, {subArea : req.body.subArea}],
        },
      });
      if (getUserByType == null) {
        await UserBot.User.sync();
        let userTableResposne = UserBot.User.build(req.body);
        let resp = await userTableResposne.save();
        res.send(new ResponseObject(200, 'Suceesfuuly Created', true, resp));
      }
      
      else {
        res.send(
          new ResponseObject(
            401,
            `User can't be created because such usertype already exists for leadplatform ${req.body.leadPlatform}, area ${req.body.area} and subArea ${req.body.subArea}`,
            true,
            {}
          )
        );
      }
    }
    
    
    
    else if (userType == 'gCad') {
      let getUserByTypeGcad = await BotUser.User.findOne({
        where: {
          userType: userType,
        },
      });

      if (getUserByTypeGcad == null) {
        await UserBot.User.sync();
        let userTableResposne = UserBot.User.build(req.body);
        let resp = await userTableResposne.save();
        res.send(new ResponseObject(200, 'Suceesfuuly Created', true, resp));
      } else {
        res.send(new ResponseObject(401, `User Already Exist for ${userType} `, true, {}));
      }
    }
    
    
    else {
      await UserBot.User.sync();
      let userTableResposne = UserBot.User.build(req.body);
      let respEnduser = await userTableResposne.save();
      console.log('resp user  ----', respEnduser);
      res.send(new ResponseObject(200, `User Created with type ${userType}`, true, respEnduser));
    }
  } else {
    res.send(
      new ResponseObject(402, `User Already Exist ${req.body.email}`, true, getUserResponse)
    );
  }
});

// get user based on email
const getUserData = catchAsync(async (req, res, next) => {
  let query = req.query;
  if (!query.email) {
    next(new AppError('Email is Missing', 404));
    return;
  }
  // find in database
  let response = await UserBot.User.findAll({
    where: {
      email: query.email,
    },
  });

  let message = 'Succesfully found user';
  if (response.length == 0) {
    message = 'No such user  exist';
  }
  res.send(new ResposneObject(200, message, true, response));
});

// updateUser
const updateUserData = catchAsync(async (req, res, next) => {
  console.log('User  ----', req.user);
  console.log('req body  ---', req.body);
  if (req.body.email == '') {
    next(new AppError('Email is Missing', 404));
    return;
  }

  if (req.body.email == req.user.email) {
    if (req.body.toUpdateUser.userType != undefined) {
      console.log('user fixes');
      res.send(new ResponseObject(405, 'Admins cannot update own role', false, {}));
      return;
    }
  }
  for (const prop in req.body.toUpdateUser) {
    let validations = await UserValidations(req.body.toUpdateUser[prop], prop);
    if (validations != true) {
      next(validations);
      return;
    }
  }
  if (req.body.toUpdateUser.userType == 'gCad') {
    const resultGcadUpdate = await UserBot.User.findOne({
      where: {
        userType: 'gCad',
      },
    });
    console.log('res ----------------', resultGcadUpdate);
    if (resultGcadUpdate != null) {
      res.send(
        new ResponseObject(401, `User can't be updated because such user type already exist`, false, {})
      );
      return;
    }
  } else if (
    req.body.toUpdateUser.userType == 'firstGfcf' ||
    req.body.toUpdateUser.userType == 'gfcf'
  ) {
    const resultuserTypeUpdate = await UserBot.User.findOne({
      where: {
        userType: req.body.toUpdateUser.userType,
        mco: req.body.toUpdateUser.mco,
        cluster: req.body.toUpdateUser.cluster,
      },
    });
    console.log('user type  --- update', resultuserTypeUpdate);
    if (resultuserTypeUpdate != null) {
      res.send(
        new ResponseObject(401, `User can't be updated because such usertype already exist `, false, {})
      );
      return;
    }
  }

  else if (
    req.body.toUpdateUser.userType == 'firstLevelGPMApprover' ||
    req.body.toUpdateUser.userType == 'GPMapprover'
  ) {
    const resultuserTypeUpdate = await UserBot.User.findOne({
      where: {
        userType: req.body.toUpdateUser.userType,
        leadPlatform: req.body.toUpdateUser.leadPlatform,
        area: req.body.toUpdateUser.area,
        subArea : req.body.toUpdateUser.subArea,
      },
    });
    console.log('user type  --- update', resultuserTypeUpdate);
    if (resultuserTypeUpdate != null) {
      res.send(
        new ResponseObject(401, `User can't be updated because such usertype already exist `, false, {})
      );
      return;
    }
  }




  // email handled by sql
  let responseUpdate = await UserBot.User.update(req.body.toUpdateUser, {
    where: {
      email: req.body.email,
    },
  });

  let updateMessage = 'Updated Successfully';
  if (responseUpdate[0] == 0) {
    updateMessage = 'No such user exist';
    res.send(new ResponseObject(404, updateMessage, true, {}));
  } else {
    let response = await UserBot.User.findOne({
      where: {
        email: req.body.email,
      },
    });
    res.send(new ResponseObject(200, updateMessage, true, response));
  }
});



// update user personal details

const updateUserPersonalData = catchAsync(async (req, res, next) => {
 



  // for (const prop in req.body.toUpdateUser) {
  //   let validations = await UserValidations(req.body.toUpdateUser[prop], prop);
  //   if (validations != true) {
  //     next(validations);
  //     return;
  //   }
  // }

  // email handled by sql
  let responseUpdate = await UserBot.User.update(req.body.toUpdateUser, {
    where: {
      email: req.body.email,
    },
  });

  let updateMessage = 'Updated Successfully';
  if (responseUpdate[0] == 0) {
    updateMessage = 'No such user exist';
    res.send(new ResponseObject(404, updateMessage, true, {}));
  } else {
    let response = await UserBot.User.findOne({
      where: {
        email: req.body.email,
      },
    });
    res.send(new ResponseObject(200, updateMessage, true, response));
  }
});



// delete user
const deleteUser = catchAsync(async (req, res, next) => {
  if (req.user.userType != 'admin') {
    res.send(new ResponseObject('404', 'Unauthorized', false, {}));
    return;
  }
  if (req.user.email == req.body.email) {
    res.send(new ResponseObject(401, 'Admin can be deleted', false, {}));
    return;
  }
  let deleteResponse = await BotUser.User.destroy({
    where: {
      email: req.body.email,
    },
  });

  console.log('delelte user respone  ---', typeof deleteResponse);

  if (deleteResponse == undefined || deleteResponse == null || typeof deleteResponse == NaN) {
    res.send(new ResponseObject(401, 'unable to delete', false, {}));
    return;
  }
  // hdndle
  res.send(new ResponseObject(200, 'Successfully Deleted', true, deleteResponse));
});

const userLogin = catchAsync(async (req, res, next) => {});

const getAllUser = catchAsync(async (req, res, next) => {
  let { search } = req.query;
  console.log('search ', search);
  console.log('req ---', req.query);
    let query = req.query;
    let offset = 0;
    if (Object.keys(query).includes('offset')) {
      offset = parseInt(query.offset);
      //console.log("andar", offset)
      delete query.offset;
    }
  if (req.user.userType == 'admin') {

    let allUsers = '';
    if (req.query.userTypeFilter == "All") {

    

  
    if (search != undefined && search != '') {
      allUsers = await BotUser.User.findAndCountAll({
        limit: 10,
        offset: offset,
        where: {
          [Op.or]: [
            // {name: {
            //   [Op.like]:`%${search}%`
            // }
            // },
            {email: {
              [Op.like]:`%${search}%`
            }
            },
            {userType: {
              [Op.like]:`%${search}%`
            }
            }
          ],

          userType : {
            [Op.not] : ['businessOwner']
          }

        }
      });
    } else {
      allUsers = await BotUser.User.findAndCountAll({
        limit: 10,
        offset: offset,
        where : {
          userType : {
            [Op.not] : ['businessOwner']
          }
        }
      });
    }
  }

  else {

   
    if (search != undefined && search != '') {
      allUsers = await BotUser.User.findAndCountAll({
        limit: 10,
        offset: offset,
        where: {
          [Op.or]: [
            // {name: {
            //   [Op.like]:`%${search}%`
            // }
            // },
            {email: {
              [Op.like]:`%${search}%`
            }
            },
            {userType: {
              [Op.like]:`%${search}%`
            }
            }
          ],

          userType : req.query.userTypeFilter

        }
      });
    } else {
      allUsers = await BotUser.User.findAndCountAll({
        limit: 10,
        offset: offset,
        where : {
          userType : req.query.userTypeFilter
        }
      });
    }
  }
      res.send(new ResponseObject(200, 'Users Found', true, allUsers));
    } else {
      res.send(new ResponseObject(404, 'Unauthorized', false, {}));
    }
});
const getUserUsingPrimaryKey = catchAsync(async (req, res, next) => {
  //
});
export default {
  createUsers,
  getUserData,
  updateUserData,
  deleteUser,
  userLogin,
  getAllUser,
  getUserUsingPrimaryKey,
  createBusinnesOwner,
  updateUserPersonalData
};
