import _ from 'lodash';

import catchAsync from '../helpers/catchAsync';
//import { Op, QueryTypes,  literal, Dialect } from 'sequelize';
import BotValidations from '../helpers/validation';
import ResponseObject from '../helpers/responseObjectClass';
import AppError from '../helpers/AppError';
import multiparty from 'multiparty';
import excelToJson from 'convert-excel-to-json';
import sequalize from '../helpers/Sequalize';

import fs from 'fs';
// create bot
import ElasticIndex from './elasticSearch';
import BotUser from '../models/BotUser';
import AzureFolderNames from '../models/azureFolderNames';
import azureConnection from '../helpers/azureConnection';
import Excel from 'exceljs';
import config from '../../config/env';

import ElasticClient from '../helpers/elasticConnection';
import { createApproveBotMailer, updateBotMailer } from './mailerController';
import { Op, QueryTypes, literal, selectQuery } from 'sequelize';

//Create Bot
const createBot = catchAsync(async (req, res, next) => {
  // console.log("Req body  ----", req.body);

  console.log('req suer  ----', req.user);
  console.log('req body  ----', req.body);
  if (
    req.user.userType == 'admin' ||
    req.user.userType == 'qrManager' ||
    req.user.userType == 'supportStatus' ||
    req.user.userType == 'internalUser'
  ) {
    for (const prop in req.body) {
      let response = await BotValidations(req.body[prop], prop);
      if (response != true) {
        next(response);
        return;
      }
    }
    try {
      await BotUser.Bot.sync();
      let bot = BotUser.Bot.build(req.body);
      let botCreateResponse = await bot.save();
      console.log('Bot id ', botCreateResponse.dataValues.botID);
      let elasticIndex = await ElasticClient.index({
        index: 'botindex',
        id: botCreateResponse.dataValues.botID,
        type: '_doc',
        body: botCreateResponse.dataValues,
      });
      //console.log('indexsing response -----', elasticIndex);
      //console.log("Elastic Index");
      //set bot data to
      let mailerObject = {
        botData: botCreateResponse.dataValues,
        userData: req.user,
        type: 'CreateBot',
      };

      console.log('Mailer Object');
      await AzureFolderNames.sync();
      AzureFolderNames.destroy({
        where: {
          folderName: req.body.documentFolderName,
        },
      });

      //console.log('Elastic Index', elasticIndex);
      console.log('CALLING CREATE BOT MAILER');
      let mailerResponse = await createApproveBotMailer(mailerObject);

      res.send(new ResponseObject(200, 'Successfully Created', true, botCreateResponse));
      return;
    } catch (e) {
      console.log('Failed to create  ', e);
    }
  } else {
    res.send(new ResponseObject(401, 'Unauthorized User', false, {}));
  }
});

//  update bot
const editBot = catchAsync(async (req, res, next) => {
  console.log('req user  --', req.user);

  // because we return a promise for an array, destructuring is recommended
  if (req.body.botID == '') {
    next(new ResponseObject(400, 'Email is Missing', false, {}));
    return;
  }
  let updateBot = await BotUser.Bot.update(req.body.botUpdateFields, {
    where: {
      botID: req.body.botID,
    },
  });
  console.log('Update  ----', updateBot);
  const getBotToUpdateElastic = await BotUser.Bot.findOne({
    where: {
      botID: req.body.botID,
    },
  });
  console.log('get bot  ----------', getBotToUpdateElastic);
  //console.log('req body  ---', getBotToUpdateElastic.dataValues);;
  //let botId = parseInt(req.body.botID);
  const elasticUpdateResponse = await ElasticClient.index({
    index: 'botindex',
    id: req.body.botID,
    type: '_doc',
    body: getBotToUpdateElastic.dataValues,
  });

  console.log('bot updated on elastic  ---', elasticUpdateResponse);
  let mailerObject = {
    user: req.user,
    botData: getBotToUpdateElastic.dataValues,
  };
  console.log('mailer object --', mailerObject);
  updateBotMailer(mailerObject);

  let updateBotMessage = 'Bot Updated Sucessfully';

  if (updateBot[1] === 0) {
    updateBotMessage = 'No such  bot found';
  }
  // handle response in case of success and fail
  res.send(new ResponseObject(200, updateBotMessage, true, updateBot));
});

// delete bot
const deleteBot = catchAsync(async (req, res, next) => {
  for (const prop in req.body) {
    let response = await BotValidations(req.body[prop], prop);
    if (response != true) {
      next(response);
      return;
    }
  }
  let botDeleteResponse = await BotUser.Bot.destroy({
    where: {
      botId: req.body.botId,
      UserEmail: req.body.UserEmail,
    },
  });
  let botDeleteMessage = 'Bot Sucessfully Deleted';
  if (botDeleteResponse === 0) {
    botDeleteMessage = 'No such bot exist';
  }

  res.send(new ResponseObject(200, botDeleteMessage, true, botDeleteResponse));
});

// get  all bots for particular user
const getBot = catchAsync(async (req, res, next) => {
  let query = req.query;
  console.log('query in get bot  --', req.user);
  const result = await BotUser.Bot.findAll({
    where: {
      UserEmail: req.user.email,
    },
  });

  let getBotMessage = 'Suceessfully Found';
  if (result.length == 0) {
    getBotMessage = 'No Bot associated with user';
  }
  res.send(new ResponseObject(200, getBotMessage, true, result));
});

// get bot using id and filter // used for approval
const getBotUsingId = catchAsync(async (req, res, next) => {
  console.log('req user  ---', req.user);
  console.log(req.query, 'request query at bot');
  if (req.query == undefined) {
    res.send(new ResponseObject(500, 'Empty Query', false, {}));
    return;
  }
  const result = await BotUser.Bot.findByPk(req.query.botID);
  console.log('result of get  -----', result);
  let getBotMessage = 'Suceessfully Found';
  console.log(result, 'result of botsssssss');
  if (result == null) {
    getBotMessage = 'No Bot associated with such id ';
  }
  res.send(new ResponseObject(200, getBotMessage, true, result));
});

const getBotDetails = catchAsync(async (req, res, next) => {
  let query = req.query;
  console.log('query --', query);
  let { keyword, technology, cluster, leadPlatform, status } = req.query;

  let keys = Object.keys(query);
  // Cluster

  if (req.query == null || req.query == '' || keys.length == 0) {
    res.status(500);
    res.send(new ResponseObject(500, 'Null Query', false, []));
    return;
  }

  let array = [];
  let search = {};
  for (const prop in query) {
    if (prop == 'keyword') {
      // search = { q: query[prop] };
      let obj = {
        query_string: {
          query: query[prop],
        },
      };
      array.push(obj);
    } else {
      console.log('props', prop);
      console.log('query ---', query[prop]);

      let obj = {
        match: {
          [prop]: query[prop],
        },
      };
      array.push(obj);
    }
  }

  let totalBots = await ElasticClient.count({
    index: 'botindex',
    type: '_doc',
  });
  console.log(totalBots.count);
  let elasticSearchResult = await ElasticClient.search({
    // ...search,
    index: 'botindex',
    type: '_doc',
    size: totalBots.count,
    // q: `${search}*`,
    body: {
      query: {
        bool: {
          must: array,
        },
      },
    },
  });
  let responseFilter = elasticSearchResult.hits.hits;
  // console.log('response filter---', responseFilter);
  let filteredData = [];
  console.log('response filter lenht ---', responseFilter.length);
  if (responseFilter.length == 0) {
    console.log('here --- empty response');
    res.send(new ResponseObject(401, 'No such bot found', false, {}));
    return;
  }
  for (let i = 0; i < responseFilter.length; i++) {
    filteredData.push(responseFilter[i]._source);
  }
  console.log('Filtered data', filteredData.length);
  filteredData = filteredData.sort((a, b) => {
    if (a.cluster.toLowerCase() < b.cluster.toLowerCase()) {
      return -1;
    } else if (a.cluster.toLowerCase() > b.cluster.toLowerCase()) {
      return 1;
    }
    return 0;
  });

  console.log('filter by cluster --', filteredData.length);
  filteredData = filteredData.sort((a, b) => {
    if (a.country.toLowerCase() < b.country.toLowerCase()) {
      return -1;
    } else if (a.country.toLowerCase() > b.country.toLowerCase()) {
      return 1;
    }
    return 0;
  });
  console.log('filter by country --', filteredData.length);
  filteredData = filteredData.sort((a, b) => {
    if (a.botID > b.botID) {
      return -1;
    } else if (a.botID < b.botID) {
      return 1;
    }
    return 0;
  });
  let statusArray = ['Live', 'UAT', 'Retired', 'Build', 'Initial Demand'];
  let finalResult = [];
  for (let k = 0; k < statusArray.length; k++) {
    for (let j = 0; j < filteredData.length; j++) {
      console.log('filtered data stattus --', filteredData[j].status);
      if (filteredData[j].status == statusArray[k]) {
        finalResult.push(filteredData[j]);
      }
      if (finalResult.length == 4) {
        break;
      }
    }
  }
  console.log(finalResult.length);
  console.log(finalResult);
  if (finalResult.length == 0) {
    if (filteredData.length == 0) {
      res.send(new ResponseObject(402, 'no bots found', false, {}));
      return;
    }
  }
  if (finalResult.length == 0 && filteredData.length != 0) {
    finalResult = filteredData;
  }
  for (let m = 0; m < finalResult.length; m++) {
    let tempObj = {
      botID: finalResult[m].botID,
      technology: finalResult[m].technology,
      leadPlatform: finalResult[m].leadPlatform,
      status: finalResult[m].status,
      area: finalResult[m].area,
      subArea: finalResult[m].subArea,
      cluster: finalResult[m].cluster,
      country: finalResult[m].country,
      processName: finalResult[m].processName,
      processDescription: finalResult[m].processDescription,
    };
    finalResult[m] = tempObj;
  }
  // console.log('final Result  before url---', finalResult);
  for (let bot = 0; bot < finalResult.length; bot++) {
    let id = finalResult[bot].botID;
    let botUrl = `${config.baseUrl}/botDetails?botID=${id}`;
    finalResult[bot].botUrl = botUrl;
  }

  let filter = req.query;
  console.log(Object.keys(filter));
  if (Object.keys(filter).includes('keyword')) {
    console.log('filter  --- modified');
    delete filter.keyword;
  }
  console.log('filter modifed --', filter);

  let queryString = Object.keys(req.query)
    .map(function (key) {
      return key + '=' + req.query[key];
    })
    .join('&');
  console.log('query string  ---', queryString);
  res.send(
    new ResponseObject(200, 'Bots Found', true, {
      botDetialsResult: finalResult,
      botlistingUrl: `${config.baseUrl}/botStore?${queryString}`,
    })
  );
  return;
});

const botFilter = catchAsync(async (req, res, next) => {
  let query = req.query;

  if (Object.keys(req.query).length === 0) {
    next(new AppError('Empty Request', 404));
  }
  let property = '';
  for (const prop in req.query) {
    property = prop;
    let response = await BotValidations(req.query[prop], prop);
    if (response != true) {
      next(response);
      return;
    }
  }
  const result = await BotUser.Bot.findAll({
    where: query,
  });

  let getBotMessage = 'Suceessfully Found';
  if (result.length == 0) {
    getBotMessage = `No such bot associated with ${property} and value ${req.query[property]}`;
  }
  res.send(new ResponseObject(200, getBotMessage, true, result));
});

//  get all  bots for admin
const getAll = catchAsync(async (req, res, next) => {
  let query = req.query;

  if (query.userRole == 'admin') {
    const result = await BotUser.Bot.findAll();

    res.send(new ResponseObject(200, 'Sucessfully Found', true, result));
  } else {
    next(new AppError('Invalid User Type', 404));
  }
});

const getAssocitaion = catchAsync(async (req, rest, next) => {
  User.associate = function () {
    User.hasMany('Bots', { as: 'Bot' });
  };
  return User;
});

const getBotsForApproval = catchAsync(async (req, res, next) => {
  console.log('req query ', req.query);
  let { search } = req.query;
  // let search = '54';
  let searchFilter = {};
  if (search != undefined) {
    delete req.query.search;
    console.log('req query ', req.query);
    searchFilter = {
      [Op.or]: [
        {
          processName: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          botID: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          processID: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          processDescription: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          leadPlatform: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          area: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          subArea: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          country: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          requesterEmailID: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          engagementLead: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          status: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    };
  }
  // console.log("req query -----", req.query.kfa);
  let filter = req.query;
  console.log('request  ----', req.query);
  if (`kfa` in req.query) {
    filter.kfa = true;
  }
  let offset = 0;
  console.log('filter pehle', filter);
  if (Object.keys(filter).includes('offset')) {
    offset = parseInt(filter.offset);
    console.log('andar', offset);
    delete filter.offset;
  }

  console.log('filter hai ye ---', filter);
  // console.log('req user  ---', req.user);
  let reqFilterGpm = {
    area: req.user.area,
    subArea: req.user.subArea,
    leadPlatform: req.user.leadPlatform,
  };

  let reqFilterGfcf = {
    cluster: req.user.cluster,
    mco: req.user.mco,
  };

  let reqFilter = null;
  if (
    req.user.userType == 'firstGfcf' ||
    req.user.userType == 'gfcf' ||
    req.user.userType == 'gCad'
  ) {
    //console.log('user type gfcf ---', req.user.userType);
    reqFilter = reqFilterGfcf;
    //console.log('req filter ---', reqFilter);
  } else if (req.user.userType == 'firstLevelGPMApprover' || req.user.userType == 'GPMapprover') {
    //console.log('inside else');
    reqFilter = reqFilterGpm;
  }
  if (req.user.userType == 'firstGfcf' || req.user.userType == 'gfcf') {
    console.log('heere ---firstGfcf -----3');
    let whereQuery = '';
    if (req.user.userType == 'firstGfcf') {
      const gfcfFirstUser = await BotUser.User.findAll({
        where: {
          [Op.and]: [{ userType: 'gfcf' }, reqFilter],
        },
      });
      console.log('gfcf user---', gfcfFirstUser);
      if (gfcfFirstUser.length > 0) {
        // when there is second level apporved

        console.log('when first level approver is and second level both is there');
        console.log('First level gfcf');
        whereQuery = {
          [Op.and]: [
            { kfa: true },
            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
            //  { firstLevelgfcfApprover: { [Op.not]: [null, ''] } },
            //  { secondLevelGfcfApprover: { [Op.or]: [null, ''] } },
            //// questionable case
            reqFilter,
            filter,
            searchFilter,
          ],
        };
      } else {
        // when no second apporved
        console.log('search filter', searchFilter);

        console.log('No second level apporver');
        whereQuery = {
          [Op.and]: [
            { kfa: true },

            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
            //  { firstLevelgfcfApprover: { [Op.or]: [null, ''] } },
            reqFilter,
            filter,
            searchFilter,
          ],
        };

        console.log('where query ', whereQuery);
      }
    } else if (req.user.userType == 'gfcf') {
      console.log('case gfcf');
      // case 1 first level is therre with match cluster and mco

      // case 2 not there
      // where query shoould
      const gfcfUser = await BotUser.User.findAll({
        where: {
          [Op.and]: [{ userType: 'firstGfcf' }, reqFilter],
        },
      });
      console.log('gfcf user---', gfcfUser);
      if (gfcfUser.length > 0) {
        console.log('gfcf');
        whereQuery = {
          [Op.and]: [
            { kfa: true },

            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
            //{ firstLevelgfcfApprover: { [Op.not]: '' } },
             { firstLevelgfcfApprovalStatus: true },
            reqFilter,
            filter,
            searchFilter,
          ],
        };
      } else {
        // bot aapproved and sencond level not  approved
        // case user is not there but bot first level is apporved
        console.log('here gfccf 2');
        whereQuery = {
          [Op.and]: [
            { kfa: true },

            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
            // { secondLevelGfcfApprover: {[Op.or]:[null,'']} }

            reqFilter,
            filter,
            searchFilter,
          ],
        };
      }
    }
    const result = await BotUser.Bot.findAndCountAll({
      limit: 5,
      offset: offset,
      order: [['botID', 'desc']],
      where: whereQuery,
    });
    console.log('result  ---', result);
    res.send(new ResponseObject(200, 'Bot Found', true, result));
    return;
  } else if (req.user.userType == 'firstLevelGPMApprover' || req.user.userType == 'GPMapprover') {
    console.log('here inside gpm');
    // where query
    let whereQuery = '';
    if (req.user.userType == 'firstLevelGPMApprover') {
      const gpmSecond = await BotUser.User.findAll({
        where: {
          [Op.and]: [{ userType: 'GPMapprover' }, reqFilter],
        },
      });
      console.log('GPm apporveer----', gpmSecond);
      if (gpmSecond.length > 0) {
        console.log('Second leve is there');
        // if second level gpm is there
        whereQuery = {
          [Op.and]: [
            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
            // {firstLevelGpmApprover: { [Op.or]: [null, ''] } },
            // {secondLevelGpmApprover:{[Op.or]:[null,'']}},
            reqFilter,
            filter,
            searchFilter,
          ],
        };
      } else {
        console.log('first level is thre only ');
        whereQuery = {
          [Op.and]: [
            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
            // {firstLevelGpmApprover: { [Op.or]: [null, ''] } },
            reqFilter,
            filter,
            searchFilter,
          ],
        };
      }
    } else if (req.user.userType == 'GPMapprover') {
      console.log('here 2nd gpm');
      const gpmUser = await BotUser.User.findAll({
        where: {
          [Op.and]: [{ userType: 'firstLevelGPMApprover' }, reqFilter],
        },
      });
      console.log('gpmmm --', gpmUser);
      if (gpmUser.length > 0) {
        console.log('Here 2nd case');
        whereQuery = {
          [Op.and]: [
            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
           // { firstLevelGpmApprover: { [Op.not]: '' } },
             { firstLevelGpmApprovalStatus : true },
            // { secondLevelGpmApprover:{[Op.or]:[null,'']}},
            reqFilter,
            filter,
            searchFilter,
          ],
        };
      } else {
        whereQuery = {
          [Op.and]: [
            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
            // { secondLevelGpmApprover:{[Op.or]:[null,'']}},
            reqFilter,
            filter,
            searchFilter,
          ],
        };
      }
    }
    const gpmResponse = await BotUser.Bot.findAndCountAll({
      limit: 5,
      offset: offset,
      order: [['botID', 'desc']],
      where: whereQuery,
    });
    res.send(new ResponseObject(200, 'Bot Found', true, gpmResponse));
    return;
  } else if (req.user.userType == 'gCad') {
    console.log('req user gcad -------', req.user.userType);
    console.log('req filter  ---', reqFilter);
    filter.cluster = "Global"
    filter.mco = "Global"
    if (filter.kfa) {
      delete filter.kfa
    } 
    const result = await BotUser.Bot.findAndCountAll({
      limit: 5,
      offset: offset,
      order: [['botID', 'desc']],
      where: {
        [Op.and]: [
          { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
          // { gcadApprover:{[Op.or]:[null,'']}},
          filter,
          searchFilter,
        ],
      },
    });
    console.log('result  ---', result);
    res.send(new ResponseObject(200, 'Bot Found', true, result));
  } else if (req.user.userType == 'businessUserRegionWise') {
    let reqFilter = {
      cluster: req.user.cluster,
      mco: req.user.mco,
    };
    const result = await BotUser.Bot.findAndCountAll({
      limit: 5,
      offset: offset,
      order: [['botID', 'desc']],
      where: {
        [Op.and]: [
          { kfa: true },
          { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
          // { gcadApprover:{[Op.or]:[null,'']}},
          reqFilter,
          filter,
          searchFilter,
        ],
      },
    });
    res.send(new ResponseObject(200, 'Bot Found', true, result));
  } else if (
    req.user.userType == 'internalUser' ||
    req.user.userType == 'supportStatus' ||
    req.user.userType == 'releaseManager' ||
    req.user.userType == 'editAccess' ||
    req.user.userType == 'admin' ||
    req.user.userType == 'qrManager' ||
    req.user.userType == 'businessOwner'
  ) {
    console.log('req query -------', req.query);
    let gpm = false;
    if (Object.keys(req.query).includes('gpm')) {
      gpm = req.query.gpm;
      delete req.query['gpm'];
    }
    console.log('req query ---', req.query);
    if (gpm) {
      console.log('when gpm is true');
      let queryString = `concat(concat(leadPlatform, area), subArea) in (Select concat(concat(u.leadPlatform, u.area ), u.subArea) from bot_store.Users as u where userType in ('GPMapprover', 'firstLevelGPMApprover'))`;

      let getBotsWithApprover = await BotUser.Bot.findAll({
        order: [['botID', 'desc']],
        where: {
          [Op.and]: [
            literal(queryString),
            searchFilter,
            filter,
            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
          ],
        },
      });

      //  let getBotsWithApprover = await BotUser.Bot.findAll({ ,where: {[Op.and] : [literal(queryString), searchFilter, filter, { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } }]}})

      console.log('Offset  ---', offset);
      console.log('length --', getBotsWithApprover.length);
      let length = getBotsWithApprover.length;
      // slice array on bassic of offset
      // offset ---- offset +5 ;
      // offset +5 less than total length ;
      if (offset + 5 <= length) {
        getBotsWithApprover = getBotsWithApprover.slice(offset, offset + 5);
        console.log(getBotsWithApprover.length);
      } else {
        getBotsWithApprover = getBotsWithApprover.slice(offset, length);
      }
      console.log('lenghtt  ---', length);
      //getBotsWithApprover = getBotsWithApprover.slice(offset,offset+10);
      res.send(
        new ResponseObject(200, 'Bot Found', true, {
          count: length,
          rows: getBotsWithApprover,
        })
      );
    } else {
      console.log('heyyyyyy');

      const result = await BotUser.Bot.findAndCountAll({
        limit: 5,
        offset: offset,
        order: [['botID', 'desc']],
        attributes: [
          'botID',
          'processID',
          'processName',
          'processDescription',
          'leadPlatform',
          'area',
          'subArea',
          'country',
          'requesterEmailID',
          'engagementLead',
          'firstLevelgfcfApprover',
          'firstLevelgfcfApprovalStatus',
          'firstLevelGfcfApprovalDate',
          'firstLevelGfcfComment',
          'secondLevelGfcfApprover',
          'secondLevelGfcfApprovalDate',
          'secondLevelGfcfApprovalStatus',
          'secondLevelGfcfComment',
          'firstLevelGpmApprover',
          'firstLevelGpmApprovalStatus',
          'firstLevelGpmApprovalDate',
          'firstLevelGpmComment',
          'secondLevelGpmApprover',
          'secondLevelGpmApprovalDate',
          'secondLevelGpmApprovalStatus',
          'secondLevelGpmComment',
          'kfa',
          'gcadApprover',
          'gcadApprovalStatus',
          'gcadApprovalDate',
          'gcadComments',
          'businessOwnerComments',
          'status',
          'botExternalId',
          'masterBotID',
          'botType',
          'landscapeId',
        ],
        where: {
          [Op.and]: [
            { status: { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] } },
            filter,
            searchFilter,
          ],
        },
      });
       console.log("result approval ---", result.rows);
      res.send(new ResponseObject(200, 'Bot Found', true, result));
    }
  }
});

const approveBot = catchAsync(async (req, res, next) => {
  console.log('req user ---', req.user);
  var userType = _.get(req, ['user', 'userType'], '');
  var approvalMailDefault = [
    'firstGfcf',
    'gfcf',
    'firstLevelGPMApprover',
    'GPMapprover',
    'gCad',
    'qrManager',
    'businessOwner',
  ];

  if (_.includes(approvalMailDefault, userType)) {
    const updateBotData = await BotUser.Bot.update(req.body.toUpdateBotFileds, {
      where: {
        botID: req.body.botID,
      },
    });

    const getBotToUpdateElastic = await BotUser.Bot.findOne({
      where: {
        botID: req.body.botID,
      },
    });

    const elasticUpdateResponse = await ElasticClient.index({
      index: 'botindex',
      id: req.body.botID,
      type: '_doc',
      body: getBotToUpdateElastic.dataValues,
    });

    let mailerObject = {
      userData: req.user,
      botData: getBotToUpdateElastic.dataValues,
    };
    switch (userType) {
      case 'firstGfcf':
        if (getBotToUpdateElastic.dataValues.firstLevelgfcfApprovalStatus == 1) {
          updateBotMailer(mailerObject);
          res.send(new ResponseObject(200, 'Approved successfully', true, updateBotData));
        } else {
          res.send(new ResponseObject(200, 'Rejected successfully', true, updateBotData));
        }
        break;

      case 'gfcf':
        if (getBotToUpdateElastic.dataValues.secondLevelGfcfApprovalStatus == 1) {
          updateBotMailer(mailerObject);
          res.send(new ResponseObject(200, 'Approved successfully', true, updateBotData));
        } else {
          res.send(new ResponseObject(200, 'Rejected successfully', true, updateBotData));
        }
        break;

      case 'firstLevelGPMApprover':
        if (getBotToUpdateElastic.dataValues.firstLevelGpmApprovalStatus == 1) {
          updateBotMailer(mailerObject);
          res.send(new ResponseObject(200, 'Approved successfully', true, updateBotData));
        } else {
          res.send(new ResponseObject(200, 'Rejected successfully', true, updateBotData));
        }
        break;

      case 'GPMapprover':
        if (getBotToUpdateElastic.dataValues.secondLevelGpmApprovalStatus == 1) {
          updateBotMailer(mailerObject);
          res.send(new ResponseObject(200, 'Approved successfully', true, updateBotData));
        } else {
          res.send(new ResponseObject(200, 'Rejected successfully', true, updateBotData));
        }
        break;

      case 'gCad':
        if (getBotToUpdateElastic.dataValues.gcadApprovalStatus == 1) {
          updateBotMailer(mailerObject);
          res.send(new ResponseObject(200, 'Approved successfully', true, updateBotData));
        } else {
          res.send(new ResponseObject(200, 'Rejected successfully', true, updateBotData));
        }

        break;

      default:
        updateBotMailer(mailerObject);
        res.send(new ResponseObject(200, 'Approved successfully', true, updateBotData));
        break;
    }
  } else {
    res.send(new ResponseObject(404, 'Unauthorized to Approve', false, {}));
  }
});

// export all bots
const exportAllBots = catchAsync(async (req, res, next) => {
  console.log('req query', req.query);

  console.log('req user', req.user);

  if (Object.keys(req.query).includes('gpm')) {
    delete req.query['gpm'];
  }

  if (Object.keys(req.query).includes('offset')) {
    delete req.query['offset'];
  }
  // if (req.userType != "admin") {
  //   res.send(new ResponseObject(401, `unauthorized ${req.userType}`, false, {}));
  // }
  let filter = req.query;
  if (`kfa` in req.query) {
    filter.kfa = true;
  }
  let attributes = [];
  if (req.user.userType == 'endUser' || req.user.userType == 'businessOwner') {
    attributes =   [
      ["botID", "Bot ID"] ,
      ["leadPlatform", "Lead platform"],
      ["area", "Area"] ,
      ["subArea", "Sub area"] ,
      ['status', 'Status'],
      ["processName", "Process name"] ,
      ["processDescription", "Process description"] ,
      ["parentBotID", "Parent Bot ID"] ,
      ["processID", "Process ID"] , 
      ['sAPID', 'SAP ID'],
      ["requestType", "Request type"] ,      
      ["cluster", "Cluster"] ,
      ["mco", "MCO"] ,
      ["country", "Country"] ,
      ["technology", "Technology"] ,
      ["primaryApplication", "Primary application"],
      ["kfa", "KFA"] ,
      ["kfaTransactional", "KFA Transactional"] ,
      ["kfaInformational", "KFA Infromational"] ,
      ["kfaIuc", "KFA IUC"] ,
      ["processCriticality", "Process criticality"] ,
      ["tCode", "T-Code"] ,
      ["requesterEmailID", "Business requestor email address"] ,
      ["businessOwnerEmailID", "Business owner email"],
      ["engagementLead", "Engagement lead"] ,
      ['createdBy', 'Created by'],
      ['documentLink', 'Documents link'],
      ['botDemoVideo', 'Demo video link'],
      ['documentFolderName', 'documentFolderName']
      
   ]

  



  } else {
    console.log('inside apporval ');
    attributes = [
      ['botID', 'Bot ID'],
      ['leadPlatform', 'Lead platform'],
      ['area', 'Area'],
      ['subArea', 'Sub area'],
      ['status', 'Status'],
      ['processName', 'Process name'],
      ['processDescription', 'Process description'],
      ['parentBotID', 'Parent Bot ID'],
      ['requestType', 'Request type'],
      ['processID', 'Process ID'],
      ['sAPID', 'SAP ID'],
      ['cluster', 'Cluster'],
      ['mco', 'MCO'],
      ['country', 'Country'],
      ['processCriticality', 'Process criticality'],
      ['technology', 'Technology'],
      ['applications', 'Applications'],
      ['primaryApplication', 'Primary application'],
      ['kfa', 'KFA'],
      ['kfaTransactional', 'KFA Transactional'],
      ['kfaInformational', 'KFA Infromational'],
      ['kfaIuc', 'KFA IUC'],
      ['tCode', 'T-Code'],
      ['businessOwnerEmailID', 'Business owner email id'],
      ['engagementLead', 'Engagement lead'],
      ['requesterEmailID', 'Requestor email address'],
      ['toolUsed', 'Tool Used'],
      ['dateLogged', 'Date Logged'],  
      ['deliveryModel', 'Delivery model'],
      ['sopReceivedDate', 'SOP received Date'],
      ['hoursSavedYearly', 'Hours saved yearly'],
      ['initiatedBy', 'Initiated by'],
      ['dateOfStatusChanged', 'Date of status changed'],
      ['commentsForStatusChanged', 'Comments for status changed'],
      ['dataClassification', 'Data Classification'],
      ['remarks', 'Remarks'],
      ['buildName', 'Build name'],
      ['supportStatus', 'Support status'],
      ['numberOfRunsInAMonth', 'Number of runs in a month'],
      ['averageTime', 'Average running time'],
      ['costApprovalDate', 'Cost approval date'],
      ['pddSignOffDate', 'PDD sign-off date'],
      ['testStartDate', 'Test start date'],
      ['bauDate', 'BAU date'],
      ['lastModifiedDate', 'Last modified date'],
      ['uATSignOffDate', 'UAT sign-off date'],
      ['goLiveDate', 'Go Live Date'],
      ['landscapeApproval', 'Landscape approval'],
      ['landscapeApprover', 'Landscape approver'],
      ['infosecApproval', 'Infosec approval'],
      ['infosecApprover', 'Infosec approver'],
      ['firstLevelgfcfApprover', 'First level GFCF approver'],
      ['firstLevelgfcfApprovalStatus', 'First level GFCF approval status'], 
      ['firstLevelGfcfApprovalDate', 'First level GFCF approval date'],
      ['firstLevelGfcfComment', 'First level GFCF approver comment'],
      ['secondLevelGfcfApprover', 'Second level GFCF approver'],
      ['secondLevelGfcfApprovalDate', 'Second level GFCF approval date'],
      ['secondLevelGfcfApprovalStatus', 'Second level GFCF approval status'],
      ['secondLevelGfcfComment', 'Second level GFCF approver comments'],
      ['firstLevelGpmApprover', 'First level GPM approver'],
      ['firstLevelGpmApprovalStatus', 'First level GPM approval status'],
      ['firstLevelGpmApprovalDate', 'First level GPM apporval date'],
      ['firstLevelGpmComment', 'First level GPM approver comments'],
      ['secondLevelGpmApprover', 'Second level GPM approver'],
      ['secondLevelGpmApprovalDate', 'Second level GPM approval date'],
      ['secondLevelGpmApprovalStatus', 'Second level GPM approval status'],
      ['secondLevelGpmComment', 'GPM second level approver comment'],
      ['gcadApprover', 'GCAD approver name'],
      ['gcadApprovalStatus', 'GCAD approval status'],
      ['gcadApprovalDate', 'GCAD approval date'],
      ['gcadComments', 'GCAD approver comments'],
      ['businessOwnerComments', 'Business owner comments'],
      ['firstLevelControlActivity', 'Control Impacted'],
      ['firstLevelControlTable', 'Control table'],
      ['firstLevelControlProcessArea', 'Control process area'],
      ['firstLevelControlSubProcessArea', 'Control sub process area'],
      ['createdBy', 'Created by'],
      ['documentLink', 'Documents link'],
      ['botDemoVideo', 'Demo video link'],
      ['documentFolderName', 'documentFolderName']
    ];
  }

  console.log('bot ID ---desc----------------------');
  let response = await BotUser.Bot.findAll({
    attributes: attributes,
    where: filter,
    order: [['botID', 'desc']],
  });
  //
  let myAr = [];
  console.log( "response", response)

  for (let i in response) {
    // console.log('response data values --', response[i].dataValues.KFA);

    
    

    if (response[i].dataValues["Control Impacted"] == 1){
      response[i].dataValues["Control Impacted"] = "Yes";
     }
     else if(response[i].dataValues["Control Impacted"] === 0) {
      response[i].dataValues["Control Impacted"] = "No"
     } else {
	response[i].dataValues["Control Impacted"] = "";
	}     


     if (response[i].dataValues["Go Live Date"] == "2018-12-30" || response[i].dataValues["Go Live Date"] == "2018-12-31") {
      response[i].dataValues["Go Live Date"] = ""
    }

    if (response[i].dataValues["GCAD approval date"] == "2018-12-30" || response[i].dataValues["GCAD approval date"] == "2018-12-31") {
      response[i].dataValues["GCAD approval date"] = ""
    }

    if (response[i].dataValues["Second level GPM approval date"] == "2018-12-30" || response[i].dataValues["Second level GPM approval date"] == "2018-12-31") {
      response[i].dataValues["Second level GPM approval date"] = ""
    }

    if (response[i].dataValues["First level GPM apporval date"] == "2018-12-30" || response[i].dataValues["First level GPM apporval date"] == "2018-12-31") {
      response[i].dataValues["First level GPM apporval date"] = ""
    }

    if (response[i].dataValues["Second level GFCF approval date"] == "2018-12-30" || response[i].dataValues["Second level GFCF approval date"] == "2018-12-31") {
      response[i].dataValues["Second level GFCF approval date"] = ""
    }

    if (response[i].dataValues["First level GFCF approval date"] == "2018-12-30" || response[i].dataValues["First level GFCF approval date"] == "2018-12-31") {
      response[i].dataValues["First level GFCF approval date"] = ""
    }

    if (response[i].dataValues["Date Logged"] == "2018-12-30" || response[i].dataValues["Date Logged"] == "2018-12-31") {
      response[i].dataValues["Date Logged"] = ""
    }

    if (response[i].dataValues["SOP received Date"] == "2018-12-30" || response[i].dataValues["SOP received Date"] == "2018-12-31") {
      response[i].dataValues["SOP received Date"] = ""
    }
    if (response[i].dataValues["Date of status changed"] == "2018-12-30" || response[i].dataValues["Date of status changed"] == "2018-12-31") {
      response[i].dataValues["Date of status changed"] = ""
    }
    if (response[i].dataValues["Cost approval date"] == "2018-12-30" || response[i].dataValues["Cost approval date"] == "2018-12-31") {
      response[i].dataValues["Cost approval date"] = ""
    }

    if (response[i].dataValues["PDD sign-off date"] == "2018-12-30" || response[i].dataValues["PDD sign-off date"] == "2018-12-31") {
      response[i].dataValues["PDD sign-off date"] = ""
    }
    if (response[i].dataValues["Test start date"] == "2018-12-30" || response[i].dataValues["Test start date"] == "2018-12-31") {
      response[i].dataValues["Test start date"] = ""
    }
    if (response[i].dataValues["BAU date"] == "2018-12-30" || response[i].dataValues["BAU date"] == "2018-12-31") {
      response[i].dataValues["BAU date"] = ""
    }
    if (response[i].dataValues["Last modified date"] == "2018-12-30" || response[i].dataValues["Last modified date"] == "2018-12-31") {
      response[i].dataValues["Last modified date"] = ""
    }
    if (response[i].dataValues["UAT sign-off date"] == "2018-12-30" || response[i].dataValues["UAT sign-off date"] == "2018-12-31") {
      response[i].dataValues["UAT sign-off date"] = ""
    }
   
   if (response[i].dataValues["First level GFCF approval status"] == 1){
    response[i].dataValues["First level GFCF approval status"] = "Approved";
   }
   else if (response[i].dataValues["First level GFCF approval status"] === 0){
    response[i].dataValues["First level GFCF approval status"] = "Rejected"
   }
   else {
    response[i].dataValues["First level GFCF approval status"] = ""
   }


   
   if (response[i].dataValues["Landscape approval"] == 1){
    response[i].dataValues["Landscape approval"] = "Yes";
   }
   else if(response[i].dataValues["Landscape approval"] === 0) {
    response[i].dataValues["Landscape approval"] = "No"
   } else {
	response[i].dataValues["Landscape approval"] = "";
	}

   if (response[i].dataValues["Infosec approval"] == 1){
    response[i].dataValues["Infosec approval"] = "Yes";
   }
   else if(response[i].dataValues["Infosec approval"] === 0) {
    response[i].dataValues["Infosec approval"] = "No"
   } else {
	response[i].dataValues["Infosec approval"] = "";
	}
  

   
  
     if (response[i].dataValues['Second level GFCF approval status'] == 1){
    response[i].dataValues['Second level GFCF approval status'] = "Approved";
   }
   else if (response[i].dataValues['Second level GFCF approval status'] === 0){
    response[i].dataValues['Second level GFCF approval status'] = "Rejected"
   }
   else {
    response[i].dataValues['Second level GFCF approval status'] = ""
   }


   if (response[i].dataValues[ 'First level GPM approval status'] == 1){
    response[i].dataValues[ 'First level GPM approval status'] = "Approved";
   }
   else if (response[i].dataValues[ 'First level GPM approval status'] === 0){
    response[i].dataValues[ 'First level GPM approval status'] = "Rejected"
   }
   else {
    response[i].dataValues[ 'First level GPM approval status'] = ""
   }



   
   if (response[i].dataValues['Second level GPM approval status'] == 1){
    response[i].dataValues['Second level GPM approval status'] = "Approved";
   }
   else if (response[i].dataValues['Second level GPM approval status'] === 0){
    response[i].dataValues['Second level GPM approval status'] = "Rejected"
   }
   else {
    response[i].dataValues['Second level GPM approval status'] = ""
   }



      
   if (response[i].dataValues[ 'GCAD approval status'] == 1){
    response[i].dataValues[ 'GCAD approval status'] = "Approved";
   }
   else if (response[i].dataValues[ 'GCAD approval status'] === 0){
    response[i].dataValues[ 'GCAD approval status'] = "Rejected";
   }
   else {
    response[i].dataValues[ 'GCAD approval status'] = "";
   }


    if (response[i].dataValues["KFA"] == 1) {
      response[i].dataValues["KFA"] = "Yes";
    } else {
      response[i].dataValues["KFA"] = "No";
    }


    if (response[i].dataValues["KFA Transactional"] == 1) {
      response[i].dataValues["KFA Transactional"] = "Yes";
    } else if(response[i].dataValues["KFA Transactional"] === 0) {
      response[i].dataValues["KFA Transactional"] = "No";
    } else {
	response[i].dataValues["KFA Transactional"] = "";	}

    if (response[i].dataValues["KFA Infromational"] == 1) {
      response[i].dataValues["KFA Infromational"] = "Yes";
    } else if (response[i].dataValues["KFA Infromational"] === 0) {
      response[i].dataValues["KFA Infromational"] = "No";
    } else {
	response[i].dataValues["KFA Infromational"] = "";
	}

    if (response[i].dataValues["KFA IUC"] == 1) {
      response[i].dataValues["KFA IUC"] = "Yes";
    } else if (response[i].dataValues["KFA IUC"] === 0) {
      response[i].dataValues["KFA IUC"] = "No";
    }
    else {
      response[i].dataValues["KFA IUC"] = "";
    }

    if (response[i].dataValues['Demo video link'] && response[i].dataValues['Demo video link'] != "null") {

    
      response[i].dataValues['Demo video link'] = `${config.fetchBlobUrl}/botDocuments/${response[i].dataValues['documentFolderName']}/${response[i].dataValues['Demo video link']}`
      }
      else {
        response[i].dataValues['Demo video link'] = ""
      }
   
    delete response[i].dataValues['documentFolderName']

    response[i].dataValues['Bot detail page link'] = `${config.baseUrl}/botDetails?botID=${response[i].dataValues["Bot ID"]}`
    console.log(response[i].dataValues);
    myAr.push(response[i].dataValues);
  }

  let workbook = await new Excel.Workbook();
  let sheet1 = await workbook.addWorksheet('Leads Data');
  let headers = {};
  for (let i in myAr[0]) {
    headers[i] = i;
  }

  sheet1.addRow().values = Object.values(headers);
  for (let i in myAr) {
    sheet1.addRow().values = Object.values(myAr[i]);
  }
  let dateFirst = new Date(Date.now()).toISOString();
  console.log(dateFirst, "dateFirst")
  let dateYYYYMMDD = dateFirst.slice(0,10)
  let year = dateYYYYMMDD.slice(0,4)
  let month = dateYYYYMMDD.slice(5,7)
  let day = dateYYYYMMDD.slice(8,10)
  let date = day+"-"+month+"-"+year
//  date = date.split('.')[0].replaceAll(':', '-');
  console.log('date', date);
  
  let fileName = `./ExcelFiles/Automation Extract_${date}.xlsx`;
  console.log('FileName', fileName);
  await workbook.xlsx.writeFile(fileName);

  const azureResponse = await azureConnection.uploadLocalFile('botstorevideo', fileName);
  console.log('Export All Azure response ---', azureResponse);
  res.send(
    new ResponseObject(
      200,
      'Sucessfully Created',
      true,
      `${config.fileUpload}/ExcelFiles/Automation Extract_${date}.xlsx`
    )
  );
});

// for approval

const exportAllBotsApproval = catchAsync(async (req, res, next) => {
  console.log("firsttttt")
  let filter = {};
  if (req.user.userType == 'admin') {
    if (`kfa` in req.query) {
      filter.kfa = true;
    }
  } else if (req.user.userType == 'GPMapprover' || req.user.userType == 'firstLevelGPMApprover') {
    filter = {
      area: req.user.area,
      subArea: req.user.subArea,
      leadPlatform: req.user.leadPlatform,
    };
  } else if (req.user.userType == 'gfcf' || req.user.userType == 'firstGfcf') {
    filter = {
      cluster: req.user.cluster,
      mco: req.user.mco,
      kfa: true,
    };
  } else if (req.user.userType == 'gCad') {
    filter = {
      cluster: req.user.cluster,
      mco: req.user.mco,
    };
  } else if (req.user.userType == 'businessOwner') {
    filter = {
      businessOwnerEmailID: req.user.email,
    };
  }

  // filter["status"] = { [Op.not]: ['Live', 'On Hold', 'Rejected', 'Retired'] }

  let attributes = [];
  console.log("second")
  attributes = [
    ['botID', 'Bot ID'],
    ['leadPlatform', 'Lead platform'],
    ['area', 'Area'],
    ['subArea', 'Sub area'],
    ['status', 'Status'],
    ['processName', 'Process name'],
    ['processDescription', 'Process description'],
    ['parentBotID', 'Parent Bot ID'],
    ['requestType', 'Request type'],
    ['processID', 'Process ID'],
    ['sAPID', 'SAP ID'],
    ['cluster', 'Cluster'],
    ['mco', 'MCO'],
    ['country', 'Country'],
    ['processCriticality', 'Process criticality'],
    ['technology', 'Technology'],
    ['applications', 'Applications'],
    ['primaryApplication', 'Primary application'],
    ['kfa', 'KFA'],
    ['kfaTransactional', 'KFA Transactional'],
    ['kfaInformational', 'KFA Infromational'],
    ['kfaIuc', 'KFA IUC'],
    ['tCode', 'T-Code'],
    ['businessOwnerEmailID', 'Business owner email id'],
    ['engagementLead', 'Engagement lead'],
    ['requesterEmailID', 'Requestor email address'],
    ['toolUsed', 'Tool Used'],
    ['dateLogged', 'Date Logged'],  
    ['deliveryModel', 'Delivery model'],
    ['sopReceivedDate', 'SOP received Date'],
    ['hoursSavedYearly', 'Hours saved yearly'],
    ['initiatedBy', 'Initiated by'],
    ['dateOfStatusChanged', 'Date of status changed'],
    ['commentsForStatusChanged', 'Comments for status changed'],
    ['dataClassification', 'Data Classification'],
    ['remarks', 'Remarks'],
    ['buildName', 'Build name'],
    ['supportStatus', 'Support status'],
    ['numberOfRunsInAMonth', 'Number of runs in a month'],
    ['averageTime', 'Average running time'],
    ['costApprovalDate', 'Cost approval date'],
    ['pddSignOffDate', 'PDD sign-off date'],
    ['testStartDate', 'Test start date'],
    ['bauDate', 'BAU date'],
    ['lastModifiedDate', 'Last modified date'],
    ['uATSignOffDate', 'UAT sign-off date'],
    ['goLiveDate', 'Go Live Date'],
    ['landscapeApproval', 'Landscape approval'],
    ['landscapeApprover', 'Landscape approver'],
    ['infosecApproval', 'Infosec approval'],
    ['infosecApprover', 'Infosec approver'],
    ['firstLevelgfcfApprover', 'First level GFCF approver'],
    ['firstLevelgfcfApprovalStatus', 'First level GFCF approval status'], 
    ['firstLevelGfcfApprovalDate', 'First level GFCF approval date'],
    ['firstLevelGfcfComment', 'First level GFCF approver comment'],
    ['secondLevelGfcfApprover', 'Second level GFCF approver'],
    ['secondLevelGfcfApprovalDate', 'Second level GFCF approval date'],
    ['secondLevelGfcfApprovalStatus', 'Second level GFCF approval status'],
    ['secondLevelGfcfComment', 'Second level GFCF approver comments'],
    ['firstLevelGpmApprover', 'First level GPM approver'],
    ['firstLevelGpmApprovalStatus', 'First level GPM approval status'],
    ['firstLevelGpmApprovalDate', 'First level GPM apporval date'],
    ['firstLevelGpmComment', 'First level GPM approver comments'],
    ['secondLevelGpmApprover', 'Second level GPM approver'],
    ['secondLevelGpmApprovalDate', 'Second level GPM approval date'],
    ['secondLevelGpmApprovalStatus', 'Second level GPM approval status'],
    ['secondLevelGpmComment', 'GPM second level approver comment'],
    ['gcadApprover', 'GCAD approver name'],
    ['gcadApprovalStatus', 'GCAD approval status'],
    ['gcadApprovalDate', 'GCAD approval date'],
    ['gcadComments', 'GCAD approver comments'],
    ['businessOwnerComments', 'Business owner comments'],
    ['firstLevelControlActivity', 'Control Impacted'],
    ['firstLevelControlTable', 'Control table'],
    ['firstLevelControlProcessArea', 'Control process area'],
    ['firstLevelControlSubProcessArea', 'Control sub process area'],
    ['createdBy', 'Created by'],
    ['documentLink', 'Documents link'],
    ['botDemoVideo', 'Demo video link'],
    ['documentFolderName', 'documentFolderName']
  ];


  console.log("third");
  let response = await BotUser.Bot.findAll({
    attributes: attributes,
    where: filter,
    order: [['botID', 'desc']],
  });

  console.log(response, "responseeeess");
  //
  let myAr = [];
  for (let i in response) {
    // console.log('response data values --', response[i].dataValues.KFA);

    if (response[i].dataValues["Control Impacted"] == 1){
      response[i].dataValues["Control Impacted"] = "Yes";
     }
     else if (response[i].dataValues["Control Impacted"] === 0) {
      response[i].dataValues["Control Impacted"] = "No"
     } else {
	 response[i].dataValues["Control Impacted"] = "";
	}
     

    

     if (response[i].dataValues["Go Live Date"] == "2018-12-30" || response[i].dataValues["Go Live Date"] == "2018-12-31") {
      response[i].dataValues["Go Live Date"] = ""
    }

    if (response[i].dataValues["GCAD approval date"] == "2018-12-30" || response[i].dataValues["GCAD approval date"] == "2018-12-31") {
      response[i].dataValues["GCAD approval date"] = ""
    }

    if (response[i].dataValues["Second level GPM approval date"] == "2018-12-30" || response[i].dataValues["Second level GPM approval date"] == "2018-12-31") {
      response[i].dataValues["Second level GPM approval date"] = ""
    }

    if (response[i].dataValues["First level GPM apporval date"] == "2018-12-30" || response[i].dataValues["First level GPM apporval date"] == "2018-12-31") {
      response[i].dataValues["First level GPM apporval date"] = ""
    }

    if (response[i].dataValues["Second level GFCF approval date"] == "2018-12-30" || response[i].dataValues["Second level GFCF approval date"] == "2018-12-31") {
      response[i].dataValues["Second level GFCF approval date"] = ""
    }

    if (response[i].dataValues["First level GFCF approval date"] == "2018-12-30" || response[i].dataValues["First level GFCF approval date"] == "2018-12-31") {
      response[i].dataValues["First level GFCF approval date"] = ""
    }

    if (response[i].dataValues["Date Logged"] == "2018-12-30" || response[i].dataValues["Date Logged"] == "2018-12-31") {
      response[i].dataValues["Date Logged"] = ""
    }

    if (response[i].dataValues["SOP received Date"] == "2018-12-30" || response[i].dataValues["SOP received Date"] == "2018-12-31") {
      response[i].dataValues["SOP received Date"] = ""
    }
    if (response[i].dataValues["Date of status changed"] == "2018-12-30" || response[i].dataValues["Date of status changed"] == "2018-12-31") {
      response[i].dataValues["Date of status changed"] = ""
    }
    if (response[i].dataValues["Cost approval date"] == "2018-12-30" || response[i].dataValues["Cost approval date"] == "2018-12-31") {
      response[i].dataValues["Cost approval date"] = ""
    }

    if (response[i].dataValues["PDD sign-off date"] == "2018-12-30" || response[i].dataValues["PDD sign-off date"] == "2018-12-31") {
      response[i].dataValues["PDD sign-off date"] = ""
    }
    if (response[i].dataValues["Test start date"] == "2018-12-30" || response[i].dataValues["Test start date"] == "2018-12-31") {
      response[i].dataValues["Test start date"] = ""
    }
    if (response[i].dataValues["BAU date"] == "2018-12-30" || response[i].dataValues["BAU date"] == "2018-12-31") {
      response[i].dataValues["BAU date"] = ""
    }
    if (response[i].dataValues["Last modified date"] == "2018-12-30" || response[i].dataValues["Last modified date"] == "2018-12-31") {
      response[i].dataValues["Last modified date"] = ""
    }
    if (response[i].dataValues["UAT sign-off date"] == "2018-12-30" || response[i].dataValues["UAT sign-off date"] == "2018-12-31") {
      response[i].dataValues["UAT sign-off date"] = ""
    }
   
   if (response[i].dataValues["First level GFCF approval status"] == 1){
    response[i].dataValues["First level GFCF approval status"] = "Approved";
   }
   else if (response[i].dataValues["First level GFCF approval status"] === 0){
    response[i].dataValues["First level GFCF approval status"] = "Rejected"
   }
   else {
    response[i].dataValues["First level GFCF approval status"] = ""
   }


   
   if (response[i].dataValues["Landscape approval"] == 1){
    response[i].dataValues["Landscape approval"] = "Yes";
   }
   else if(response[i].dataValues["Landscape approval"] === 0) {
    response[i].dataValues["Landscape approval"] = "No"
   } else {
	response[i].dataValues["Landscape approval"] = "";
	}

   if (response[i].dataValues["Infosec approval"] == 1){
    response[i].dataValues["Infosec approval"] = "Yes";
   }
   else if(response[i].dataValues["Infosec approval"] === 0) {
    response[i].dataValues["Infosec approval"] = "No"
   } else {
	response[i].dataValues["Infosec approval"] = "";
	}
  

   
  
     if (response[i].dataValues['Second level GFCF approval status'] == 1){
    response[i].dataValues['Second level GFCF approval status'] = "Approved";
   }
   else if (response[i].dataValues['Second level GFCF approval status'] === 0){
    response[i].dataValues['Second level GFCF approval status'] = "Rejected"
   }
   else {
    response[i].dataValues['Second level GFCF approval status'] = ""
   }


   if (response[i].dataValues[ 'First level GPM approval status'] == 1){
    response[i].dataValues[ 'First level GPM approval status'] = "Approved";
   }
   else if (response[i].dataValues[ 'First level GPM approval status'] === 0){
    response[i].dataValues[ 'First level GPM approval status'] = "Rejected"
   }
   else {
    response[i].dataValues[ 'First level GPM approval status'] = ""
   }



   
   if (response[i].dataValues['Second level GPM approval status'] == 1){
    response[i].dataValues['Second level GPM approval status'] = "Approved";
   }
   else if (response[i].dataValues['Second level GPM approval status'] === 0){
    response[i].dataValues['Second level GPM approval status'] = "Rejected"
   }
   else {
    response[i].dataValues['Second level GPM approval status'] = ""
   }



      
   if (response[i].dataValues[ 'GCAD approval status'] == 1){
    response[i].dataValues[ 'GCAD approval status'] = "Approved";
   }
   else if (response[i].dataValues[ 'GCAD approval status'] === 0){
    response[i].dataValues[ 'GCAD approval status'] = "Rejected";
   }
   else {
    response[i].dataValues[ 'GCAD approval status'] = "";
   }


    if (response[i].dataValues["KFA"] == 1) {
      response[i].dataValues["KFA"] = "Yes";
    } else {
      response[i].dataValues["KFA"] = "No";
    }


    if (response[i].dataValues["KFA Transactional"] == 1) {
      response[i].dataValues["KFA Transactional"] = "Yes";
    } else if(response[i].dataValues["KFA Transactional"] === 0) {
      response[i].dataValues["KFA Transactional"] = "No";
    } else {
	response[i].dataValues["KFA Transactional"] = "";
	}

    if (response[i].dataValues["KFA Infromational"] == 1) {
      response[i].dataValues["KFA Infromational"] = "Yes";
    } else if(response[i].dataValues["KFA Infromational"] === 0) {
      response[i].dataValues["KFA Infromational"] = "No";
    } else {
	response[i].dataValues["KFA Infromational"] = "";
	}

    if (response[i].dataValues["KFA IUC"] == 1) {
      response[i].dataValues["KFA IUC"] = "Yes";
    } else if (response[i].dataValues["KFA IUC"] === 0) {
      response[i].dataValues["KFA IUC"] = "No";
    }
    else {
      response[i].dataValues["KFA IUC"] = "";
    }
    if (response[i].dataValues['Demo video link'] && response[i].dataValues['Demo video link'] != "null") {

    
    response[i].dataValues['Demo video link'] = `${config.fetchBlobUrl}/botDocuments/${response[i].dataValues['documentFolderName']}/${response[i].dataValues['Demo video link']}`
    }
    else {
      response[i].dataValues['Demo video link'] = ""
    }

   delete response[i].dataValues['documentFolderName']

   response[i].dataValues['Bot detail page link'] = `${config.baseUrl}/botDetails?botID=${response[i].dataValues["Bot ID"]}`
    console.log(response[i].dataValues);
    myAr.push(response[i].dataValues);
  }

  let workbook = await new Excel.Workbook();
  let sheet1 = await workbook.addWorksheet('Leads Data');
  let headers = {};
  for (let i in myAr[0]) {
    headers[i] = i;
  }

  sheet1.addRow().values = Object.values(headers);
  for (let i in myAr) {
    sheet1.addRow().values = Object.values(myAr[i]);
  }
  let dateFirst = new Date(Date.now()).toISOString();
  console.log(dateFirst, "dateFirst")
  let dateYYYYMMDD = dateFirst.slice(0,10)
  let year = dateYYYYMMDD.slice(0,4)
  let month = dateYYYYMMDD.slice(5,7)
  let day = dateYYYYMMDD.slice(8,10)
  let date = day+"-"+month+"-"+year
  let fileName = `./ExcelFiles/Automation Extract_${date}.xlsx`;
  console.log('FileName', fileName);
  await workbook.xlsx.writeFile(fileName);

  const azureResponse = await azureConnection.uploadLocalFile('botstorevideo', fileName);
  console.log('Export All Azure response ---', azureResponse);
  res.send(
    new ResponseObject(
      200,
      'Sucessfully Created',
      true,
      `${config.fileUpload}/ExcelFiles/Automation Extract_${date}.xlsx`
    )
  );
});

const dataMigration = catchAsync(async (req, res, next) => {
  console.log('-----------------Data Migration Bots-------------------');
  let invalidDate = 'Invalid Date';
  // default values

  //console.log(parseInt(0.33));
//  31-12-2018
  // date
  let defaultDate = new Date('12/31/2018').toISOString();
  // boolean
  let defaultBoolean = false;
  // text
  let defaultText = 'NA';
  // default number
  let defaultNumber = 0.0;
  // mandatry fields for data base
  const mandatoryFields = [
    'botID',
    'leadPlatform',
    'area',
    'subArea',
    'cluster',
    'mco',
    'country',
    'primaryApplication',
    'applications',
    'toolUsed',
    'deliveryModel',
    'status',
    'processID',
    'processName',
    'processCriticality',
    'processDescription',
    'kfa',
    'requestType',
    'requesterEmailID',
    'engagementLead',
    'initiatedBy',
    'dataClassification',
    'supportStatus',
    'technology',
    'dateLogged',
    'sopReceivedDate',
    'tCode',
    'hoursSavedYearly',
    'businessOwnerEmailID',
    'createdBy',
    'numberOfRunsInAMonth',
    'averageTime',
    'sopDocument',
  ];

  let numberFields = ['numberOfRunsInAMonth', 'averageTime'];
  let dateFields = ['dateLogged', 'sopReceivedDate'];

  let textFields = [
    'leadPlatform',
    'area',
    'subArea',
    'cluster',
    'mco',
    'country',
    'primaryApplication',
    'applications',
    'toolUsed',
    'deliveryModel',
    'status',
    'processID',
    'processName',
    'processCriticality',
    'processDescription',
    'requestType',
    'requesterEmailID',
    'engagementLead',
    'initiatedBy',
    'dataClassification',
    'supportStatus',
    'technology',
    'tCode',
    'businessOwnerEmailID',
    'createdBy',
    'sopDocument',
    'hoursSavedYearly',
  ];
  let extremeMandatoryFields = [
    'botID',
    'leadPlatform',
    'area',
    'subArea',
    'cluster',
    'mco',
    'country',
  ];
  let form = new multiparty.Form();

  form.parse(req, async function (err, fields, files) {
    console.log("Inside form")
    console.log(files.bots[0].path)
    const json =  excelToJson({
      sourceFile: files.bots[0].path,
    });
   // console.log(json)

    if (json['botRepo'] != undefined) {
      let testBots = await json['botRepo'].slice(1018, json['botRepo'].length);
      let allBots = [];
      let validBots = [];
      let invalidRows = [];
      let dataMissing = [];

      json['botRepo'].map(async (bot, indexInExcel) => {
        let botFromExcel = {};
        if (indexInExcel > 0) {
          for (const [key, value] of Object.entries(json['botRepo'][0])) {
            let val = bot[key];
            if (val == undefined) {
              val = '';
            }
            botFromExcel[json['botRepo'][0][key]] = val;
          }
          let botObject = {
            botID: isNaN(parseInt(botFromExcel['Bot ID'])) ? '' : parseInt(botFromExcel['Bot ID']), // botFromExcel.RowKey
            leadPlatform: botFromExcel['Lead platform'],
            area: botFromExcel['Area'],
            subArea: botFromExcel['Sub area'],
            processName: botFromExcel['Process name'],
            processDescription: botFromExcel['Process description'],
            processID: botFromExcel['Process ID'],
            sAPID : botFromExcel["SAP ID"],
            cluster: botFromExcel['Cluster'],
            country: botFromExcel['Country'],
            mco: botFromExcel['MCO'],
            technology: botFromExcel['Technology'],
            primaryApplication: botFromExcel['Primary application'],
            applications: botFromExcel['Applications'],
            toolUsed: botFromExcel['Tool_Used'],
            deliveryModel:botFromExcel['Delivery model'],
            status: botFromExcel['Status'],

            dateOfStatusChanged:
              new Date(botFromExcel['Date of status changed']) != invalidDate
                ? new Date(botFromExcel['Date of status changed']).toISOString()
                : defaultDate,

            commentsForStatusChanged: botFromExcel['Comments for status changed'],
            processCriticality: botFromExcel['Process criticality'],
            kfa: botFromExcel['KFA'] == 'Yes' ? true : false,
//            kfaTransactional: botFromExcel['KFA Transactional'] == 'Yes' ? true : false,
//            kfaInformational: botFromExcel['KFA Infromational'] == 'Yes' ? true : false,
            kfaTransactional: botFromExcel['KFA Transactional'] == 'Yes' ? true : botFromExcel['KFA Transactional'] == 'No' ?false : null,
            kfaInformational: botFromExcel['KFA Infromational'] == 'Yes' ? true : botFromExcel['KFA Infromational'] == 'No' ? false : null,
            kfaIuc: botFromExcel['KFA IUC'] === "Yes" ? true : botFromExcel['KFA IUC'] === "No"? false : null,
            tCode: botFromExcel['TCode'] ? botFromExcel['TCode'] : defaultText,
            dataClassification: botFromExcel['Data Classification'],
            requestType: botFromExcel['Request type'],
            initiatedBy: botFromExcel['Initiated by'],
            businessOwnerEmailID: botFromExcel['Business owner email id'],
            engagementLead: botFromExcel['Engagement lead'],
            requesterEmailID: botFromExcel['Requestor email address'],
            createdBy: botFromExcel['Created by'],

            dateLogged:
            new Date(botFromExcel['Date Logged']) != invalidDate
              ? new Date(botFromExcel['Date Logged']).toISOString()
              : defaultDate,

            sopReceivedDate:
              new Date(botFromExcel['SOP received Date']) != invalidDate
                ? new Date(botFromExcel['SOP received Date']).toISOString()
                : defaultDate, 
                
                pddSignOffDate:
                new Date(botFromExcel['PDD sign-off date']) != invalidDate
                  ? new Date(botFromExcel['PDD sign-off date']).toISOString()
                  : defaultDate, 
                  
                  goLiveDate:
                  new Date(botFromExcel['Go Live Date']) != invalidDate
                    ? new Date(botFromExcel['Go Live Date']).toISOString()
                    : defaultDate,
                  
                    lastModifiedDate:
                    new Date(botFromExcel['Last modified date']) != invalidDate
                      ? new Date(botFromExcel['Last modified date']).toISOString()
                      : defaultDate, 

                      costApprovalDate:
                      new Date(botFromExcel['Cost approval date']) != invalidDate
                        ? new Date(botFromExcel['Cost approval date']).toISOString()
                        : defaultDate,

                        bauDate:
                        new Date(botFromExcel['BAU date']) != invalidDate
                          ? new Date(botFromExcel['BAU date'])
                          : defaultDate,

                          remarks: botFromExcel['Remarks'],

                          buildName: botFromExcel['Build name'],

                          averageTime: botFromExcel['Average running time'],


                          numberOfRunsInAMonth: isNaN(parseFloat(botFromExcel['Number of runs in a month']))
                          ? defaultNumber
                          : botFromExcel['Number of runs in a month'],

                          hoursSavedYearly: botFromExcel['Hours saved yearly'],

                          testStartDate: new Date(botFromExcel['Test start date']) != invalidDate
                            ? new Date(botFromExcel['Test start date']).toISOString()
                            : defaultDate,

                            uATSignOffDate: new Date(botFromExcel['UAT sign-off date']) != invalidDate
                              ? new Date(botFromExcel['UAT sign-off date']).toISOString()
                              : defaultDate, 

                              landscapeApprover: botFromExcel['Landscape approver'],
                              landscapeApproval : botFromExcel['Landscape approval'] ? true : null,

                              infosecApprover: botFromExcel['Infosec approver'],
                              infosecApproval: botFromExcel['Infosec approval'] ? true : null,
                              supportStatus: botFromExcel['Support status'],
                              documentLink: botFromExcel['Documents link'],
                              
                              parentBotID: isNaN(parseInt(botFromExcel['Parent Bot ID'])) ? '' : parseInt(botFromExcel['Parent Bot ID']),
                              botDemoVideo: botFromExcel['Demo video link'],
                              sopDocument: 'NULL',
                              firstLevelgfcfApprover: botFromExcel['First level GFCF approver'],

                              firstLevelgfcfApprovalStatus: botFromExcel['First level GFCF approval status'] == 'Approved' ? true : botFromExcel['First level GFCF approval status'] == 'Rejected'? false : null,
                             
                              firstLevelGfcfApprovalDate:
              new Date(botFromExcel['First level GFCF approval date']) != invalidDate
                ? new Date(botFromExcel['First level GFCF approval date']).toISOString()
                : defaultDate, 

                firstLevelGfcfComment: botFromExcel['First level GFCF approver comment'],

                secondLevelGfcfApprover: botFromExcel['Second level GFCF approver'],

                secondLevelGfcfApprovalStatus: botFromExcel['Second level GFCF approval status'] === 'Approved' ? true : botFromExcel['Second level GFCF approval status'] === 'Rejected' ? false : null,
                
                secondLevelGfcfApprovalDate:
                new Date(botFromExcel['Second level GFCF approval date']) != invalidDate
                  ? new Date(botFromExcel['Second level GFCF approval date']).toISOString()
                  : defaultDate,

                  secondLevelGfcfComment: botFromExcel['Second level GFCF approver comments'],

                  firstLevelGpmApprover: botFromExcel['First level GPM approver'],


                  firstLevelGpmApprovalStatus:
              botFromExcel['First level GPM approval status'] === 'Approved' ? true : botFromExcel['First level GPM approval status'] === 'Rejected' ? false : null,

              firstLevelGpmApprovalDate:
              new Date(botFromExcel['First level GPM apporval date']) != invalidDate
                ? new Date(botFromExcel['First level GPM apporval date']).toISOString()
                : defaultDate,

                firstLevelGpmComment: botFromExcel['First level GPM approver comments'],
        
           
            secondLevelGpmApprover: botFromExcel['Second level GPM approver'],
            secondLevelGpmApprovalStatus:
              botFromExcel['Second level GPM approval status'] === 'Approved' ? true : botFromExcel['Second level GPM approval status'] === 'Rejected' ?false  : null ,
            secondLevelGpmApprovalDate:
              new Date(botFromExcel['Second level GPM approval date']) != invalidDate
                ? new Date(botFromExcel['Second level GPM approval date']).toISOString()
                : defaultDate, //Spl_Gpm_SeconprovalDate
            secondLevelGpmComment: botFromExcel['GPM second level approver comment'],
            gcadApprover : botFromExcel['GCAD approver name'],
            gcadApprovalStatus : botFromExcel['GCAD approval status'] === "Approved" ? true : botFromExcel['GCAD approval status'] === "Rejected"?false : null,
            gcadComments : botFromExcel['GCAD approver comments'],
            gcadApprovalDate:
            new Date(botFromExcel['GCAD approval date']) != invalidDate
              ? new Date(botFromExcel['GCAD approval date']).toISOString()
              : defaultDate,
            businessOwnerComments : botFromExcel['Business owner comments'],
            
           
//             firstLevelControlActivity: botFromExcel['Control Impacted'] === 'Yes' ? true : false,
		firstLevelControlActivity: botFromExcel['Control Impacted'] === 'Yes' ? true : botFromExcel['Control Impacted'] === 'No'? false : null,           
            UserEmail: botFromExcel['Created by'],

             // firstLevelControlTable: botFromExcel.ControlTable,
            // firstLevelControlProcessArea: botFromExcel.ControlProcessArea,
            // firstLevelControlSubProcessArea: botFromExcel.ControlProcessSubArea,
            // secondLevelControlActivity: botFromExcel.ControlActivity != '' ? true : false,
            // secondLevelControlTable: botFromExcel.ControlSecondTable,
            // secondLevelControlProcessArea: botFromExcel.ControlSecondProcessArea,
            // secondLevelControlSubProcessArea: botFromExcel.ControlSecondProcessSubArea,
            // createdAt:
            //   new Date(botFromExcel.Timestamp) != invalidDate
            //     ? new Date(botFromExcel.Timestamp).toISOString()
            //     : new Date().toISOString(),
            // updatedAt:
            //   new Date(botFromExcel.Timestamp) != invalidDate
            //     ? new Date(botFromExcel.Timestamp).toISOString()
            //     : new Date().toISOString(),
            // approvedBy: botFromExcel.ApprovedBy,
            // approvalDate:
            //   new Date(botFromExcel.ApprovalDate) != invalidDate
            //     ? new Date(botFromExcel.ApprovalDate).toISOString()
            //     : defaultDate, //ApprovalDate
            
          };
          // check and filter botObject
          let flag = true;
          // console.log("Bot object ---", botObject);
          let tempDataMising = [];
          for (let i = 0; i < extremeMandatoryFields.length; i++) {
            //console.log(botObject[mandatoryFields[i]])
            if (botObject[extremeMandatoryFields[i]] == '') {
              //console.log(mandatoryFields[i]);
              tempDataMising.push(mandatoryFields[i]);
              //console.log('of mandatory --', botObject[mandatoryFields[i]]);
              flag = false;
            }
          }
          // console.log("temp --", tempDataMising.length);
          //console.log("Madatory ---", mandatoryFields.length);
          if (tempDataMising.length != mandatoryFields.length && tempDataMising.length < 31) {
            if (tempDataMising.length > dataMissing.length) {
              dataMissing = tempDataMising;
            }
          }
          //console.log("Flag ----", flag);
          if (flag) {
            for (let i = 0; i < mandatoryFields.length; i++) {
              if (botObject[mandatoryFields[i]] == '') {
                if (textFields.includes(mandatoryFields[i])) {
                  botObject[mandatoryFields[i]] = defaultText;
                }
                if (numberFields.includes(mandatoryFields[i])) {
                  botObject[mandatoryFields[i]] = defaultNumber;
                }
              }
            }
            validBots.push(botObject);
          } else {
            invalidRows.push({[botObject.botID] : tempDataMising});
          }
        }
      });
      console.log('data missing --', dataMissing);
      fs.writeFileSync('vailidMissing.json', JSON.stringify(dataMissing));
      console.log('data missing ---', dataMissing.length);
      // itreate and filter
      console.log('valid bots', validBots.length);
      console.log('invalid Bots', invalidRows.length);
      fs.writeFileSync('vailidlen.json', JSON.stringify(validBots.length));
      fs.writeFileSync('invailidlen.json', JSON.stringify(invalidRows.length));
      fs.writeFileSync('vailid.json', JSON.stringify(validBots));
      fs.writeFileSync('invailid.json', JSON.stringify(invalidRows));
      try {
        let InvalidBotsInLast = []
        for (let i = 0; i < validBots.length; i++) {
          try {
            console.log("botID", validBots[i].botID)
            await BotUser.Bot.sync();
            let bot = BotUser.Bot.build(validBots[i]);
            let botCreateResponse = await bot.save();
            await ElasticIndex.elasticIndexing(botCreateResponse.dataValues);
            console.log(i)
          }
          catch (e) {
            InvalidBotsInLast.push(validBots[i].botID)
               console.log("Error occured",e, validBots[i].botID)
          }
       
        }
      } catch (e) {
        console.log('Bot Build Error -', e);
      }
      res.send(allBots);
    }
  });
});





// const dataMigration = catchAsync(async (req, res, next) => {
//   console.log('-----------------Update SAP ID-------------------');
 
 



//   let form = new multiparty.Form();

//   form.parse(req, async function (err, fields, files) {
//     console.log("Inside form")
//     const json =  excelToJson({
//       sourceFile: files.bots[0].path,
//     });
//   //  console.log(json)

//     if (json['botRepo'] != undefined) {
//       let testBots = await json['botRepo'].slice(1018, json['botRepo'].length);
//       let allBots = [];
//       let validBots = [];
//       let invalidRows = [];
//       let dataMissing = [];

//       json['botRepo'].map(async (bot, indexInExcel) => {
//         let botFromExcel = {};
//         if (indexInExcel > 0) {
//           for (const [key, value] of Object.entries(json['botRepo'][0])) {
//             let val = bot[key];
//             if (val == undefined) {
//               val = '';
//             }
//             botFromExcel[json['botRepo'][0][key]] = val;
//           }



//           let botObject = {
//             botID: isNaN(parseInt(botFromExcel.RowKey)) ? '' : parseInt(botFromExcel.RowKey),
//             sapId : botFromExcel["SAP ID"]
//           }
//           validBots.push(botObject);
        
//         }
//       });
     
//       try {
//         let InvalidBotsInLast = []
//         for (let i = 0; i < validBots.length; i++) {
//           try {
//             console.log("botID", validBots[i].botID)
//             await BotUser.Bot.sync();
//             await BotUser.Bot.update({sapId : validBots[i].sapId}, {
//               where: {
//                 botID: validBots[i].botID
//               },
//             });
           
//           //  await ElasticIndex.elasticIndexing(botCreateResponse.dataValues);
   
//           }
//           catch (e) {
//             InvalidBotsInLast.push(validBots[i].botID)
//                console.log("Error occured",e, validBots[i].botID)
//           }
       
//         }
//       } catch (e) {
//         console.log('Bot Build Error -', e);
//       }
//       res.send(allBots);
//     }
//   });
// });

const indexalldata = async (req, res, next) => {
  res.send('started');
  const result = await BotUser.Bot.findAll({
    offset: 300 * req.query.offset,
    limit: req.query.limit || 300,
//	where: {
//	      botID: req.query.botID,
//    	},
  });
  //  console.log("result is here",result[0])

  //  for (let index = 0; index < result.length; index++) {

  result.map(async (item) => {
    await ElasticIndex.elasticIndexing(item.dataValues);
  });

  //   await ElasticIndex.elasticIndexing(result[0].dataValues);

  //  }
};

const addFolderName = async (req, res, next) => {
  try {
    console.log('RQQQQBODY', req.body);
    await AzureFolderNames.sync();
    let azureFolderName = AzureFolderNames.build(req.body);
    let azureFolderNameResponse = await azureFolderName.save();
    res.send(new ResponseObject(200, 'Sucessfully Created', true, azureFolderNameResponse));
  } catch (error) {
    console.log(error);
  }
};
const getBotCount = catchAsync(async (req, res, next) => {
  const {landscapeId,parentBotID,botType}=req.body;
  if(botType==="master"){
    const getMaxCountOfMasterBotId=await BotUser.Bot.findOne({
      order: [ [ 'masterBotID', 'DESC' ]],
  });
  console.log("getMaxCountOfMasterBotId",getMaxCountOfMasterBotId)
  res.send(new ResponseObject(200, 'Last Inserted MasterBotId', true, {masterBotID:getMaxCountOfMasterBotId.masterBotID}));

  }else{
  if(landscapeId,parentBotID){
    const BotCount=await BotUser.Bot.count({
      where: {
        [Op.and]: [
          {landscapeId: landscapeId},
          {masterBotID: parentBotID},
          {requestType: {[Op.eq]: `Roll Out`},},
      ]
      },
    })
    res.send(new ResponseObject(200, 'Bot Count', true, {BotCount:BotCount}));

  }else{
  console.log("v")
    next(new AppError("Bad Request", 400));
  }
}
});
const getBotIdByExtID = catchAsync(async (req, res, next) => {
  const {id}=req.body;
  console.log("id",id)
    const BotCount=await BotUser.Bot.findOne({
      attributes:['botID'],
      where: 
          {botExternalId: id}
    })
    res.send(new ResponseObject(200, 'Bot', true, {botID:BotId.botID}));

});
const editDocumentLink = async (req, res, next) => {
   console.log("route works")
  if (req.body.newDocumentLink) {
    let responseUpdate = await  BotUser.Bot.update({ documentLink : req.body.newDocumentLink }, {
      where: {
        botID: req.body.botID,
      },
    });

    console.log(responseUpdate, "RESPONSEUPDATE")
    if (responseUpdate[0] == 0) {
      updateMessage = `Bot does not exist with botID ${req.body.botID}`;
      res.send(new ResponseObject(404, updateMessage, true, {}));
    } else {
      let response = await BotUser.Bot.findOne({
        where: {
          botID: req.body.botID,
        },
      });
      res.send(new ResponseObject(200, " Document link updated successfully", true, response));
    }

  }
  else {
    next(new AppError('Document Link is Missing', 404));
    return;
  }

}
export default {
  createBot,
  editBot,
  getBotCount,
  deleteBot,
  getBot,
  getAll,
  getAssocitaion,
  botFilter,
  getBotDetails,
  exportAllBots,
  approveBot,
  getBotUsingId,
  getBotsForApproval,
  dataMigration,
  exportAllBotsApproval,
  indexalldata,
  addFolderName,
  editDocumentLink,
  getBotIdByExtID
};
