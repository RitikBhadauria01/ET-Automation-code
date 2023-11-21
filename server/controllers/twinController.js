import catchAsync from '../helpers/catchAsync';
import twinValidations from '../helpers/twinValidation';
import employeeTwin from '../models/employeeTwin';
import BotUser from '../models/BotUser';
import softSkill from '../models/softSkill';
import ResponseObject from '../helpers/responseObjectClass';
import ElasticClient from '../helpers/elasticConnection';
import sgMail from '@sendgrid/mail';
import EmployeeTwinFed from '../models/twinFeedback';
import twinDocumentLink from '../models/twinDocumentLink';
//import sequelize from '../helpers/Sequalize';
import Sequelize from '../helpers/Sequalize';
import sequelize,{Op} from 'sequelize';

////
import {feedbackMail, randomMail,orderMail, CheckoutMail,addSkillMail,deleteSkillMail,costControlMail } from './mailerController';

////
import ET_cart from '../models/ET_Cart_new';

import ET_card from '../models/ET_card'
import products from "../models/products";
import Product_cart from "../models/productCart";
//const { Op } = require('sequelize');
//order mail API
import ET_order from '../models/ET_order';
import deleteCostUseret from '../models/deleteCostUser';
import Cost_per_Skill from '../models/Cost_per_Skill';
import userPerBot from '../models/User_Per_Bot';
import skillRatings from '../models/skill_rating';
import miniCart from '../models/miniCart';

import InvoiceForm from '../models/InvoiceForm';
const PDFDocument = require('pdfkit');
import path from 'path';

const fs = require('fs');

import et_user from '../models/ET_user';
import newUserUnilever from '../models/newUser';
// create ET
const createTwin = catchAsync(async (req, res, next) => {
  const table = await employeeTwin.employeeTwin.sync();
  const employeeTwinID_p = req.body.employeeTwinID;
  for (const prop in req.body) {
    // Generate employee twin id
    if (prop == 'employeeTwinID' && req.body[prop] == '') {
      let employee_id = await table
        .findAll()
        .then((row) => {
          const row_length = row.length;
          const previous_id = row[row_length - 1].dataValues.id;
          return previous_id + 1;
        })
        .catch((err) => {
          console.log('err', err);
        });
      if (typeof employee_id == 'undefined') {
        employee_id = 'ET00001';
      } else if (employee_id < 10) {
        employee_id = 'ET0000' + employee_id;
      } else if (employee_id < 100) {
        employee_id = 'ET000' + employee_id;
      } else if (employee_id < 1000) {
        employee_id = 'ET00' + employee_id;
      } else if (employee_id < 10000) {
        employee_id = 'ET0' + employee_id;
      } else {
        employee_id = 'ET' + employee_id;
      }
      req.body[prop] = employee_id;
    }
    // end Generate employee twin id
  }
  try {
    if (employeeTwinID_p == '') {
      // data to database table: employeeTwins
      const twin = employeeTwin.employeeTwin.build(req.body);
      const twinCreateResponse = await twin.save();
      const message = 'Successfully created';

      let elasticIndex = await ElasticClient.index({
        index: 'doctwinindex',
        id: twinCreateResponse.id,
        type: '_doc',
        body: twinCreateResponse,
      });

      res.send(new ResponseObject(200, message, true, twinCreateResponse));
    } else {

      const responseID = await employeeTwin.employeeTwin.findOne({
        where:{
          employeeTwinID: req.body.employeeTwinID
        },
        raw: true
      })
      const twinCreateResponse = await employeeTwin.employeeTwin.update(req.body, {
        where: { employeeTwinID: employeeTwinID_p },
      });
      const elasticUpdateResponse = await ElasticClient.index({
        index: 'doctwinindex',
        id: responseID.id,
        type: '_doc',
        body: req.body,
      });
      const message = 'Successfully updated';
      if (twinCreateResponse == 0) {
        const message = 'Not updated because employee id is wrong.';
        res.send(new ResponseObject(500, message, false, twinCreateResponse));
      } else {
        res.send(new ResponseObject(200, message, true, req.body));
      }
    }
  } catch (err) {
    console.log('errpr++++', err);
  }
});

//get Twin
const getTwin = catchAsync(async (req, res, next) => {
    const table = await employeeTwin.employeeTwin.sync();
    const result = await table.findAll();
    const rem = result.filter(result => result.status != '');
    let getTwinMessage = 'Suceessfully Found';
    if (result.length == 0) {
        getTwinMessage = 'Not found';
    }
    try {
        res.send(new ResponseObject(200, getTwinMessage, true, rem));
    } catch (err) {
        console.error('err', err);
    }
});
{/*

const searchTwin = catchAsync(async (req, res, next) => {
    const table = await employeeTwin.employeeTwin.sync();
    const result = await table.findAll({
        where: {
            employeeTwinID: req.query.empTwinId
        }
    });

    let searchTwinMessage = 'Suceessfully Found';
    if (result.length <= 0) {
        searchTwinMessage = 'Not found';
        res.send(new ResponseObject(500, searchTwinMessage, true));
    }
    try {
        res.send(new ResponseObject(200, searchTwinMessage, true, result));
    } catch (err) {
        console.error('err', err);
    }
}); */}

// modified search twin api-vk
const searchTwin = catchAsync(async (req, res, next) => {
    // console.log("line 415 searchTwin ",req.query.empTwinId);
    const table = await employeeTwin.employeeTwin.sync();
    const result = await table.findAll({
        where: {
            employeeTwinID: req.query.empTwinId
        }
    });
    const data =result[0].softSkill
  //   console.log("line 117",data)

    let allData=result
    
const split_string = data.split(`,`);
 console.log("line 118",split_string)

    const tableSoft = await softSkill.sync();
    const resultSoft = await tableSoft.findAll({
        where: {
            softSkillID:split_string,
        }
    });
     console.log("line 125",resultSoft);


    let searchTwinMessage = 'Suceessfully Found';

   
   // if (resultSoft.length <= 0) {
       // searchTwinMessage = 'Not found';
     //   res.send(new ResponseObject(500, searchTwinMessage, true));
   // }
    if (resultSoft.length <= 0) {
        searchTwinMessage = 'Not found';
        res.send(new ResponseObject(500, searchTwinMessage, true));
    }
    try {
        // res.send(new ResponseObject(200, searchTwinMessage, true, resultSoft,allData));
        console.log("line 122",allData);
        res.status(200).json({
            message:searchTwinMessage,
            softskill:resultSoft,
            allSkill:allData,
            code:200
        })
    } catch (err) {
        console.error('err', err);
    }
});
{/*
const botSearch = catchAsync(async (req, res, next) => {
    const botID = req.split(',');
    const data_json = new Object([]);
    for (let i = 0; i < botID.length; i++) {
        const result = await BotUser.Bot.findAll({
            where: {
               botExternalId: botID[i]
            }
        });
        
        data_json[i] = { 
            'botExternalId': botID[i],
            'botID': result[0].dataValues.botID, 
            'processName': result[0].dataValues.processName, 
            'estimatedDeliveryDate':  result[0].dataValues.goLiveDate,
            'processDescription':result[0].dataValues.processDescription
        }
    }
    const test = data_json
    test.sort(function(a,b){
        return new Date(b.estimatedDeliveryDate) - new Date(a.estimatedDeliveryDate);
      });
    try {
        const getBotMessage = 'Suceessfully Found';
        if (data_json.length < 1) {
            getBotMessage = 'No Bot associated with user';
        }
        res.send(new ResponseObject(200, getBotMessage, true, data_json));
    } catch (err) {
        console.log('err', err);
    }
});*/}
/*
const botSearch = catchAsync(async (req, res, next) => {
  const botID = req.split(',');
  const data_json = [];

  for (let i = 0; i < botID.length; i++) {
    const result = await BotUser.Bot.findAll({
      where: {
        botExternalId: botID[i],
      },
    });

    const bot = result[0].dataValues;
    
    data_json[i] = {
      'botExternalId': botID[i],
      'botID': bot.botID,
      'processName': bot.processName,
      'estimatedDeliveryDate': bot.goLiveDate,
      'processDescription': bot.processDescription,
    };
    
    // Calculate average rating for each bot
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: botID[i],
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageRating = totalRating / ratings.length;
      
      if (!isNaN(averageRating)) {
        data_json[i].averageRating = averageRating;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        data_json[i].averageRating = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      data_json[i].averageRating = 0; // Default to 0 if no ratings
    }
  }

  // Sort the data_json array by estimatedDeliveryDate
  //data_json.sort((b, a) => new Date(b.estimatedDeliveryDate) - new Date(a.estimatedDeliveryDate));
  data_json.sort((a, b) => b.averageRating - a.averageRating);
  try {
    const getBotMessage = 'Successfully Found';
    if (data_json.length < 1) {
      getBotMessage = 'No Bot associated with user';
    }

    res.send(new ResponseObject(200, getBotMessage, true, data_json));
  } catch (err) {
    console.log('err', err);
  }
});
*/

const botSearch = catchAsync(async (req, res, next) => {
  let botID = req.split(',');
  let data_json = [];

  for (let i = 0; i < botID.length; i++) {

    let result;
    let value = botID[i];

    if( value[0] == "S"){
      
      result = await softSkill.findAll({
        where:{softSkillID  :value},
      })

    }else{
      result = await BotUser.Bot.findAll({
        where: {
          botExternalId: value,
        },
      });
    }


    let bot = result[0].dataValues;
 
    
    if(value[0] == 'S'){
      data_json[i] = {
        'botID': bot.softSkillID,
        'botExternalId': bot.softSkillID,
        'processName': bot.skillName,
        'processDescription': bot.skillDescription,
      }
    }else{
      data_json[i] = {
        'botExternalId': botID[i],
        'botID': bot.botID,
        'processName': bot.processName,
        'estimatedDeliveryDate': bot.goLiveDate,
        'processDescription': bot.processDescription,
      };
    }
    
    // Calculate average rating for each bot
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: botID[i],
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageRating = totalRating / ratings.length;
      
      if (!isNaN(averageRating)) {
        data_json[i].averageRating = averageRating;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        data_json[i].averageRating = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      data_json[i].averageRating = 0; // Default to 0 if no ratings
    }
  }

  // Sort the data_json array by estimatedDeliveryDate
  //data_json.sort((b, a) => new Date(b.estimatedDeliveryDate) - new Date(a.estimatedDeliveryDate));
  data_json.sort((a, b) => b.averageRating - a.averageRating);

  try {
    const getBotMessage = 'Successfully Found';
    if (data_json.length < 1) {
      getBotMessage = 'No Bot associated with user';
    }

    res.send(new ResponseObject(200, getBotMessage, true, data_json));
  } catch (err) {
    console.log('err', err);
  }
});


{/* 08/09/23
const localGlobalSkillTwin = catchAsync(async (req, res, next) => {
    const table = await employeeTwin.employeeTwin.sync();

    let search = req.query.empTwinId;
    if (search == '') {
        let getTwinMessage = 'query of skill is empty';
        res.send(new ResponseObject(500, getTwinMessage, true));
    } else if (typeof (search) == 'undefined') {
        let getTwinMessage = 'query of skill is not defined';
        res.send(new ResponseObject(500, getTwinMessage, true));
    }
    search = parseInt(search.replace(/[^\d.]/g, ''));

    const result = await table.findAll().then(data => {
        if (req.path == '/globalSkill') {
            return data[search - 1].globalSkill;
        } else {
            return data[search - 1].localSkill;
        }

    });

    let getTwinMessage = 'Suceessfully Found';
    if (typeof (result) == 'undefined') {
        getTwinMessage = 'Not found';
    } else if (result.length == 0) {
        getTwinMessage = 'Not found';
    } else {
        botSearch(result, res, next);
    }
});
*/}
const localGlobalSkillTwin = catchAsync(async (req, res, next) => {
    const table = await employeeTwin.employeeTwin.sync();

    let search = req.query.empTwinId;
    if (search == '') {
        let getTwinMessage = 'query of skill is empty';
        res.send(new ResponseObject(500, getTwinMessage, true));
    } else if (typeof (search) == 'undefined') {
        let getTwinMessage = 'query of skill is not defined';
        res.send(new ResponseObject(500, getTwinMessage, true));
    }
    search = parseInt(search.replace(/[^\d.]/g, ''));

    const result = await table.findAll().then(data => {
        if (req.path == '/globalSkill') {
            return data[search - 1].globalSkill;
        }
        if (req.path == '/transactions') {
          return data[search - 1].transactions;
        }
        if (req.path == '/reporting') {
          return data[search - 1].reporting;
        }
        if (req.path == '/cognitive') {
          return data[search - 1].cognitive;
        }
        if (req.path == '/decisionautomations') {
          return data[search - 1].decisionautomations;
        }
        if (req.path == '/genAI') {
          return data[search - 1].genAi;
        }
         else {
            return data[search - 1].localSkill;
        }

    });
    console.log("line number 235",result.length);
    let getTwinMessage = 'Suceessfully Found';
    if (typeof (result) == 'undefined') {
        getTwinMessage = 'Not found';
        res.send(new ResponseObject(200, "Not found", false));
    } else if (result.length == 0) {
        getTwinMessage = 'Not found';
        res.send(new ResponseObject(200, "Not found", false));
    } else {
        botSearch(result, res, next);
    }
});

{/*const DltLocalGlobalSkillTwin = catchAsync(async (req, res, next) => {
    const table = await employeeTwin.employeeTwin.sync();

    let { employeeTwinID, skillID } = req.body;

    const result = await table.findAll({
        where: {
            employeeTwinID: employeeTwinID
        }
    }).then(data => {
        let skill;
        if (req.path == '/globalSkill') {
            skill = data[0].globalSkill;
        } else if (req.path == '/localSkill') {
            skill = data[0].localSkill;
        }
        skill = skill.split(',');
        let globalSkill_arr = [];
        let value = true;
        skill.forEach((id, i) => {
            if (id != skillID) {
                globalSkill_arr.push(id);
            } else {
                value = false;
            }
        });
        if (value) {
            res.send(new ResponseObject(500, 'skill id not match', false));
        }
        globalSkill_arr = globalSkill_arr.toString();
        if (req.path == '/globalSkill') {
            let respose = employeeTwin.employeeTwin.update(
                { globalSkill: globalSkill_arr },
                { where: { employeeTwinID: employeeTwinID } }
            );
        } else if (req.path == '/localSkill') {
            let respose = employeeTwin.employeeTwin.update(
                { localSkill: globalSkill_arr },
                { where: { employeeTwinID: employeeTwinID } }
            );
        }
        res.send(new ResponseObject(200, 'Delete successfully', true));
    });
});*/}

const DltLocalGlobalSkillTwin = catchAsync(async (req, res, next) => {
    const table = await employeeTwin.employeeTwin.sync();

    let { employeeTwinID, businessRequest, skillID } = req.body;
    console.log("line 582....>>>",employeeTwinID, skillID);

    const result = await table.findAll({
        where: {
            employeeTwinID: employeeTwinID ,
              
        }
    }).then(data => {
        console.log("line 589==>>>",data);
        let skill;
        if (req.path == '/globalSkill/') {
            skill = data[0].globalSkill;
        } else if (req.path == '/localSkill/') {
            skill = data[0].localSkill;
        } else if(req.path == '/softSkill/'){
            skill = data[0].softSkill;
        }
        else if(req.path == '/productSkill/'){
            skill = data[0].product_id;
        }

        skill = skill.split(',');
        let globalSkill_arr = [];
        let value = true;
        skill.forEach((id, i) => {
            if (id != skillID) {
                globalSkill_arr.push(id)
;
            } else {
                value = false;
            }
        });
        if (value) {
            res.send(new ResponseObject(500, 'skill id not match', false));
        }
        globalSkill_arr = globalSkill_arr.toString();
        if (req.path == '/globalSkill/') {
            let respose = employeeTwin.employeeTwin.update(
                { globalSkill: globalSkill_arr },
                { where: 
                    { employeeTwinID: employeeTwinID },
                   
                  }
            );
        } else if (req.path == '/localSkill/') {
            let respose = employeeTwin.employeeTwin.update(
                { localSkill: globalSkill_arr },
                { where: 
                    { employeeTwinID: employeeTwinID },
                    
                  }
            );
        }else if (req.path == '/softSkill/'){
            let respose = employeeTwin.employeeTwin.update(
                { softSkill: globalSkill_arr },
                { where:
                    { employeeTwinID: employeeTwinID },
                    }
            );
        }
        else if (req.path == '/productSkill/') {
            let respose = employeeTwin.employeeTwin.update(
                { product_id: globalSkill_arr },
                { where:
                    { employeeTwinID: employeeTwinID },

                  }
            );
        }
        res.send(new ResponseObject(200, 'Delete successfully', true));
    });
    
  

  });

const softSkillSearch = catchAsync(async (req, res, next) => {
    const table = await softSkill.sync();
    let skillID = req.split(',');
    let data_json = new Object();
    for (let i = 0; i < skillID.length; i++) {
        const result = await table.findAll({
            where: {
                softSkillID: skillID[i]
            }
        });
        data_json[i] = { 'skillID': result[0].dataValues.softSkillID, 'processName': result[0].dataValues.skillName };
    }
    try {
        let getSkillMessage = 'Suceessfully Found';
        if (data_json.length < 1) {
            getSkillMessage = 'No skill available';
        }
        res.send(new ResponseObject(200, getSkillMessage, true, data_json));
    } catch (err) {
        console.log('err', err);
    }
});

///Feedback 
const feedBackApi = catchAsync(async (req, res, next,) => {
    try {
        await EmployeeTwinFed.sync();
        const addData = EmployeeTwinFed.build(req.body)
        let saveData = await addData.save()
        let mailerObject = {
            feedData: saveData.dataValues,
            user: req.user,
            type: "feedback"
        };
        await feedbackMail(mailerObject);
        console.log(">>>>>>>>>>>>><<<<<<<",mailerObject.user)
        res.send(new ResponseObject(200, 'email sent successfully', true, saveData.dataValues));

    } catch (error) {
        res.status(400).send(error)

    }
});

const sumManulAndFte = catchAsync(async (req, res) => {
    try {
        const table = await employeeTwin.employeeTwin.sync();
        let data_json = new Object();
        let manualhour = await table.findAll({
            attributes: [
                [sequelize.fn('sum', sequelize.col('manualhour')), 'manualhour'], 
                [sequelize.fn('sum', sequelize.col('fte')), 'fte']
              ],
              raw: true
        });
      
        data_json = manualhour[0]
        res.send(new ResponseObject(200,"sum",  true, data_json));
    } catch (err) {
        console.log('err', err);
    }
});

//document link
const documentLink = catchAsync(async (req, res) => {
    const table = await twinDocumentLink.sync();
    const twin = twinDocumentLink.build(req.body);
    const twinDocumentResponse = await twin.save();
    const message = 'Successfully created';
    try {
        res.send(new ResponseObject(200, message, true, twinDocumentResponse));
    } catch (err) {
        console.log('err', err);
    }
});

////randomMailData
const randomMailData = catchAsync(async (req, res, next,) => {
    try {
        await EmployeeTwinFed.sync();
        const addData = EmployeeTwinFed.build(req.body)
        let saveData = await addData.save()
        let mailerObject = {
            randomData: saveData.dataValues,
            user: req.user,
            type: "random mail"
        };
        await randomMail(mailerObject);
        console.log(">>>>>>>>>>>>><<<<<<<",mailerObject.user)
        res.send(new ResponseObject(200, 'random mail wali api', true, saveData.dataValues));

    } catch (error) {
        res.status(400).send(error)

    }
});


//add/update cart api

const updateCart = catchAsync(async(req,res,next)=>{
    const table = await ET_card.ET_card.sync();
    let { businessRequest,employeeTwinID,globalSkill,localSkill,softSkill } = req.body;
    console.log("line 140",businessRequest);
    console.log("line 140",employeeTwinID);


    const result = await table.findAll({
    where: {
            [Op.and]: [
                { employeeTwinID: employeeTwinID },
                { businessRequest: businessRequest }
              ]
        }
    });
    console.log("line 153",result);
    if(result.length >= 1){
        console.log("if part");
        // const table = await employeeTwin.employeeTwin.sync();
        // const resultData = await table.findAll({
        //     where: {     
        //         employeeTwinID: employeeTwinID
        //     }
        // });
        // console.log("line 347",resultData);
    const gptData = {
        businessRequest:req.body.businessRequest,
        globalSkill: req.body.globalSkill,
        localSkill: req.body.localSkill,
        softSkill:req.body.softSkill,
        employeeTwinID: req.body.employeeTwinID,
    }

    console.log("line 182",gptData);
 
       const updateData = await ET_card.ET_card.update( gptData,
        {  where: {
            [Op.and]: [
                { employeeTwinID: employeeTwinID },
                { businessRequest: businessRequest }
              ]
        } }).then(()=>{
          console.log("sb shi chal rha h...");
        }).catch((err)=>{
       console.log("line 362",err);
        })
        console.log("line 174",updateData);
        const message = 'Successfully updated'
        if(updateData == 0){
            const message = 'Not updated because employee id is wrong.'
            res.send(new ResponseObject(500, message, false, updateData));
        }else{
            res.send(new ResponseObject(200, message, true, gptData));
        }
    }else{
        console.log("line 196",employeeTwinID);
        console.log("line 176 else part");
        const table = await employeeTwin.employeeTwin.sync();
        const result = await table.findAll(
            {
                where: {
                    employeeTwinID: employeeTwinID
                }
            }
        );
       const tableCart = await ET_card.ET_card.sync();
       const cart = ET_card.ET_card.build({
        businessRequest:req.body.businessRequest,
        globalSkill: result[0].globalSkill,
        localSkill: result[0].localSkill,
        softSkill:result[0].softSkill,
        employeeTwinID: result[0].employeeTwinID,
    
    });
    let getTwinMessage = 'Suceessfully craeted';
    
       const cartResponse = await cart.save();
       try {
        res.send(new ResponseObject(200, getTwinMessage, true, cartResponse));
    } catch (err) {
        console.error('err', err);
    }
    }
})
//delete cart api

const deleteCart = catchAsync(async (req, res, next) => {
    const table = await ET_card.ET_card.sync();

    let { employeeTwinID, businessRequest, skillID } = req.body;
    console.log("line 582....>>>",employeeTwinID, skillID);

    const result = await table.findAll({
        where: {
            [Op.and]: [
                { employeeTwinID: employeeTwinID },
                { businessRequest: businessRequest }
              ]
        }
    }).then(data => {
        console.log("line 589==>>>",data);
        let skill;
        if (req.path == '/globalSkill/cart') {
            skill = data[0].globalSkill;
        } else if (req.path == '/localSkill/cart') {
            skill = data[0].localSkill;
        } else if(req.path == '/softSkill/cart'){
            skill = data[0].softSkill;
        }
        skill = skill.split(',');
        let globalSkill_arr = [];
        let value = true;
        skill.forEach((id, i) => {
            if (id != skillID) {
                globalSkill_arr.push(id)
;
            } else {
                value = false;
            }
        });
        if (value) {
            res.send(new ResponseObject(500, 'skill id not match', false));
        }
        globalSkill_arr = globalSkill_arr.toString();
        if (req.path == '/globalSkill/cart') {
            let respose = ET_card.ET_card.update(
                { globalSkill: globalSkill_arr },
                { where: { [Op.and]: [
                    { employeeTwinID: employeeTwinID },
                    { businessRequest: businessRequest }
                  ] } }
            );
        } else if (req.path == '/localSkill/cart') {
            let respose = ET_card.ET_card.update(
                { localSkill: globalSkill_arr },
                { where: { [Op.and]: [
                    { employeeTwinID: employeeTwinID },
                    { businessRequest: businessRequest }
                  ] } }
            );
        }else if (req.path == '/softSkill/cart'){
            let respose = ET_card.ET_card.update(
                { softSkill: globalSkill_arr },
                { where: { [Op.and]: [
                    { employeeTwinID: employeeTwinID },
                    { businessRequest: businessRequest }
                  ] } }
            );
        }
        res.send(new ResponseObject(200, 'Delete successfully', true));
    });
    
  

  });


const localGlobalCartTwin = catchAsync(async (req, res, next) => {
    try {
        const { businessRequest, employeeTwinID} = req.body
        const table = await ET_card.ET_card.sync();
        const result = await table.findAll({
            where: {
                [Op.and]: [
                    { employeeTwinID: employeeTwinID },
                    { businessRequest: businessRequest }
                  ]
            }
        });
        console.log("line 224",result[0].globalSkill);
        console.log("line 224",result[0].localSkill);
        console.log("line 224",result[0].softSkill);
        const dataGlobal =result[0].globalSkill
    const dataLocal =result[0].localSkill
    const dataSoft =result[0].softSkill

    // console.log("line 117",dataGlobal)
    // console.log("line 117",dataLocal)
    // console.log("line 117",dataSoft)

    
const split_string_Global = dataGlobal.split(`,`);
console.log("line 118",split_string_Global)

const split_string_Local = dataLocal.split(`,`);
console.log("line 118",split_string_Local)

const split_string_soft = dataSoft.split(`,`);
console.log("line 118",split_string_soft)

const tableSoft = await softSkill.sync();
const resultSoft = await tableSoft.findAll({
    where: {
        softSkillID:split_string_soft,
    }
});

    
    const resultGlobal = await BotUser.Bot.findAll({
        where: {
            botExternalId:split_string_Global,
        }
    });

    const resultLocal = await BotUser.Bot.findAll({
        where: {
            botExternalId:split_string_Local,
        }
    });


    console.log("line 441",resultSoft);
    console.log("line 442",resultGlobal);
    console.log("line 442",resultLocal);

    res.status(200).json({
        LocalSkill:resultLocal,
        GlobalSkill:resultGlobal,
        softSkill:resultSoft,
        code:200
    })

        
    } catch (error) {
        console.log("line 227",error);
    }
});

//latest purchase
{/*const getAllTwinData = catchAsync(async(req,res,next)=>{

    try {
        const table = await employeeTwin.employeeTwin.sync();
        const result2 = await table.findAll({});
        const results =result2
    const dataValues = results.map(result => result.dataValues);

    
const globalSkills = dataValues.map(obj => obj.globalSkill);
const localSkills = dataValues.map(obj => obj.localSkill);
console.log("line 639",globalSkills); 
console.log("line 640",localSkills);


// for local skills
const originalListLocal = localSkills;
const newList = [];

for (let i = 0; i < originalListLocal.length; i++) {
  const nestedList = originalListLocal[i].split(',');
  for (let j = 0; j < nestedList.length; j++) {
    newList.push(nestedList[j]);
  }
}
// console.log("line 652==>>",newList);


//for global skills
const originalListGlobal = globalSkills;
const newListGlo = [];
for (let i = 0; i < originalListGlobal.length; i++) {
  const nestedList = originalListGlobal[i].split(',');
  for (let j = 0; j < nestedList.length; j++) {
    newListGlo.push(nestedList[j]);
  }
}
// console.log("line 652==>>",newListGlo);
// console.log("line 635",dataValues);
const tableSoft = await softSkill.sync();
const resultSoft = await tableSoft.findAll({});
const resultsSoftSkill =resultSoft
const dataValuesSoftSkill = resultsSoftSkill.map(result => result.dataValues);
const resultSkillMap = dataValuesSoftSkill.map(({ softSkillID, skillName, category }) => ({ softSkillID, skillName,category }));

// console.log("line 644",dataValuesSoftSkill);  
// const softSkillID = dataValuesSoftSkill.map(obj => obj.softSkillID);
// const softSkillName = dataValuesSoftSkill.map(obj => obj.skillName);
// console.log("line 648",softSkillID);
const resultLocal = await BotUser.Bot.findAll({
    where: {
        botExternalId:newList,
    }
});
const dataValuesLocaal = resultLocal.map(result => result.dataValues);
const resultlocMap = dataValuesLocaal.map(({ botExternalId,botID, processName,leadPlatform,area,subArea  }) => ({botExternalId,botID, processName,leadPlatform,area,subArea  }));
// console.log("line 656",resultlocMap);
// const mainLocalSkills = dataValuesLocaal.map(obj => obj.primaryApplication);
const resultGlobal = await BotUser.Bot.findAll({
    where: {
       botExternalId:newListGlo,
    }
});

const dataValuesGlobal = resultGlobal.map(result => result.dataValues);
const resultGloMap = dataValuesGlobal.map(({botExternalId,botID, processName,leadPlatform,area,subArea  }) => ({ botExternalId,botID, processName,leadPlatform,area,subArea  }));
// console.log("line 656",dataValuesLocaal);
// const mainGloablSkills = dataValuesGlobal.map(obj => obj.primaryApplication);
res.status(200).json({
    globalSkills:{
      data:resultGloMap
    },
    localSkills:{
       data:resultlocMap
    },
    softSkillID:{
        data:resultSkillMap
    },
    code:200,
})
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
        console.log("line 634",error);
    }
})*/}
const getAllTwinData = catchAsync(async (req, res, next) => {
    try {
      const table = await employeeTwin.employeeTwin.sync();
      const result2 = await table.findAll({});
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const globalSkills = dataValues.map((obj) => obj.globalSkill);
      const localSkills = dataValues.map((obj) => obj.localSkill);
      const softSkills = dataValues.map((obj) => obj.softSkill);
  
     // ! for local skills
      const originalListLocal = localSkills;
      const newList = [];
  
      for (let i = 0; i < originalListLocal.length; i++) {
        const nestedList = originalListLocal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
  
     // ! for global skills
      const originalListGlobal = globalSkills;
      const newListGlo = [];
      for (let i = 0; i < originalListGlobal.length; i++) {
        const nestedList = originalListGlobal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newListGlo.push(nestedList[j]);
        }
      }
  
      // !  for softSkills
      const originalListSoft = softSkills;
      const newListSoft = [];
      for (let i = 0; i < originalListSoft.length; i++) {
        const nestedList = originalListSoft[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newListSoft.push(nestedList[j]);
        }
      }
  
      const resultSoft = await softSkill.findAll({
        where: {
          softSkillID: newListSoft,
        },
      });
      const resultLocal = await BotUser.Bot.findAll({
        where: {
          botExternalId: newList,
        },
      });
      const dataValuesLocaal = resultLocal.map((result) => result.dataValues);
      const resultlocMap = dataValuesLocaal.map(
        ({ botExternalId, botID, processName, leadPlatform, area, subArea,processDescription}) => ({
          botExternalId,
          botID,
          processName,
          leadPlatform,
          area,
          subArea,
          processDescription
        })
      );
  
      const resultGlobal = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListGlo,
        },
      });
  
      const dataValuesGlobal = resultGlobal.map((result) => result.dataValues);
      const resultGloMap = dataValuesGlobal.map(
        ({ botExternalId, botID, processName, leadPlatform, area, subArea,processDescription }) => ({
          botExternalId,
          botID,
          processName,
          leadPlatform,
          area,
          subArea,
          processDescription
        })
      );
      res.status(200).json({
        globalSkills: {
          data: resultGloMap,
        },
        localSkills: {
          data: resultlocMap,
        },
        softSkillID: {
          data: resultSoft,
        },
        code: 200,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
      console.log('line 634', error);
    }
  });


/*leadplatform*/
const getLeadPlatform = catchAsync(async (req, res, next) => {
    try {
      const leadPlatform = req.body.leadPlatform;
      const table = await employeeTwin.employeeTwin.sync();
      const result2 = await table.findAll({});
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const globalSkills = dataValues.map((obj) => obj.globalSkill);
      const localSkills = dataValues.map((obj) => obj.localSkill);
      console.log('line 639', globalSkills);
      console.log('line 640', localSkills);
  
      // for local skills
      const originalListLocal = localSkills;
      const newList = [];
  
      for (let i = 0; i < originalListLocal.length; i++) {
        const nestedList = originalListLocal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
      // console.log("line 652==>>",newList);
  
      //for global skills
      const originalListGlobal = globalSkills;
      const newListGlo = [];
      for (let i = 0; i < originalListGlobal.length; i++) {
        const nestedList = originalListGlobal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newListGlo.push(nestedList[j]);
        }
      }
  
      const resultLocal = await BotUser.Bot.findAll({
        where: {
          [Op.and]: [
            { botExternalId: newList },
            { leadPlatform: leadPlatform },
            // {area:"Plan"},
            // {subArea:"Demand Planning"}
          ],
        },
      });
      const dataValuesLocaal = resultLocal.map((result) => result.dataValues);
      console.log('line 766', dataValuesLocaal);
  
      const resultlocMap = dataValuesLocaal.map(({ botExternalId,botID, processName,leadPlatform,area,subArea  }) => ({ botExternalId,botID, processName,leadPlatform,area,subArea  }));
      // console.log("line 656",resultlocMap);
      // const mainLocalSkills = dataValuesLocaal.map(obj => obj.primaryApplication);
      const resultGlobal = await BotUser.Bot.findAll({
        where: {
          [Op.and]: [
            { botExternalId: newListGlo },
            { leadPlatform: leadPlatform },
            // {area:"Plan"},
            // {subArea:"Demand Planning"}
          ],
        },
      });
      const dataValuesGlobal = resultGlobal.map((result) => result.dataValues);
      console.log('line 782', dataValuesGlobal);
      const resultGloMap = dataValuesGlobal.map(({ botExternalId,botID, processName,leadPlatform,area,subArea  }) => ({botExternalId,botID, processName,leadPlatform,area,subArea  }));
  
      res.status(200).json({
        globalSkills: {
          data: resultGloMap,
        },
        localSkills: {
          data: resultlocMap,
        },
        code:200
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        code:400
      });
      console.log('line 634', error);
    }
  });
  
  const getArea = catchAsync(async (req, res, next) => {
    try {
      const leadPlatform = req.body.leadPlatform;
      const area = req.body.area;
  
      const table = await employeeTwin.employeeTwin.sync();
      const result2 = await table.findAll({});
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const globalSkills = dataValues.map((obj) => obj.globalSkill);
      const localSkills = dataValues.map((obj) => obj.localSkill);
      console.log('line 639', globalSkills);
      console.log('line 640', localSkills);
  
      // for local skills
      const originalListLocal = localSkills;
      const newList = [];
  
      for (let i = 0; i < originalListLocal.length; i++) {
        const nestedList = originalListLocal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
      // console.log("line 652==>>",newList);
  
      //for global skills
      const originalListGlobal = globalSkills;
      const newListGlo = [];
      for (let i = 0; i < originalListGlobal.length; i++) {
        const nestedList = originalListGlobal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newListGlo.push(nestedList[j]);
        }
      }
  
      const resultLocal = await BotUser.Bot.findAll({
        where: {
          [Op.and]: [
            { botExternalId: newList },
            { leadPlatform: leadPlatform },
            { area: area },
            // {subArea:"Demand Planning"}
          ],
        },
      });
      const dataValuesLocaal = resultLocal.map((result) => result.dataValues);
      console.log('line 766', dataValuesLocaal);
  
      const resultlocMap = dataValuesLocaal.map(({ botExternalId,botID, processName,leadPlatform,area,subArea  }) => ({botExternalId,botID, processName,leadPlatform,area,subArea  }));
      // console.log("line 656",resultlocMap);
      // const mainLocalSkills = dataValuesLocaal.map(obj => obj.primaryApplication);
      const resultGlobal = await BotUser.Bot.findAll({
        where: {
          [Op.and]: [
            { botExternalId: newListGlo },
            { leadPlatform: leadPlatform },
            { area: area },
            // {subArea:"Demand Planning"}
          ],
        },
      });
      const dataValuesGlobal = resultGlobal.map((result) => result.dataValues);
      console.log('line 782', dataValuesGlobal);
      const resultGloMap = dataValuesGlobal.map(({botExternalId,botID, processName,leadPlatform,area,subArea  }) => ({ botExternalId,botID, processName,leadPlatform,area,subArea  }));
  
      res.status(200).json({
        globalSkills: {
          data: resultGloMap,
        },
        localSkills: {
          data: resultlocMap,
        },
        code:200
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        code:200
      });
      console.log('line 634', error);
    }
  });
  
  const getSubArea = catchAsync(async (req, res, next) => {
    try {
      const leadPlatform = req.body.leadPlatform;
      const area = req.body.area;
      const subArea = req.body.subArea;
  
      const table = await employeeTwin.employeeTwin.sync();
      const result2 = await table.findAll({});
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const globalSkills = dataValues.map((obj) => obj.globalSkill);
      const localSkills = dataValues.map((obj) => obj.localSkill);
      console.log('line 639', globalSkills);
      console.log('line 640', localSkills);
  
      // for local skills
      const originalListLocal = localSkills;
      const newList = [];
  
      for (let i = 0; i < originalListLocal.length; i++) {
        const nestedList = originalListLocal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
      // console.log("line 652==>>",newList);
  
      //for global skills
      const originalListGlobal = globalSkills;
      const newListGlo = [];
      for (let i = 0; i < originalListGlobal.length; i++) {
        const nestedList = originalListGlobal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newListGlo.push(nestedList[j]);
        }
      }
  
      const resultLocal = await BotUser.Bot.findAll({
        where: {
          [Op.and]: [
            { botExternalId: newList },
            { leadPlatform: leadPlatform },
            { area: area },
            { subArea: subArea },
          ],
        },
      });
      const dataValuesLocaal = resultLocal.map((result) => result.dataValues);
      console.log('line 766', dataValuesLocaal);
  
      const resultlocMap = dataValuesLocaal.map(({botExternalId,botID, processName,leadPlatform,area,subArea  }) => ({ botExternalId,botID, processName,leadPlatform,area,subArea  }));
      // console.log("line 656",resultlocMap);
      // const mainLocalSkills = dataValuesLocaal.map(obj => obj.primaryApplication);
      const resultGlobal = await BotUser.Bot.findAll({
        where: {
          [Op.and]: [
            { botExternalId: newListGlo },
            { leadPlatform: leadPlatform },
            { area: area },
            { subArea: subArea },
          ],
        },
      });
      const dataValuesGlobal = resultGlobal.map((result) => result.dataValues);
      console.log('line 782', dataValuesGlobal);
      const resultGloMap = dataValuesGlobal.map(({ botExternalId,botID, processName,leadPlatform,area,subArea  }) => ({ botExternalId,botID, processName,leadPlatform,area,subArea  }));
  
      res.status(200).json({
        globalSkills: {
          data: resultGloMap,
        },
        localSkills: {
          data: resultlocMap,
        },
        code:200
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        code:400
      });
      console.log('line 634', error);
    }
  });

  const updateCartNew = catchAsync(async (req, res, next) => {
    const table = await ET_cart.ET_cart.sync();
    let { businessRequest, globalSkill, localSkill, softSkill,product_id } = req.body;
    console.log('line 935', businessRequest);
    // console.log('line 140', employeeTwinID);
  
    const result = await table.findAll({
      where: {
        businessRequest: businessRequest,
      },
    });
    console.log('line 943', result);
    if (result.length >= 1) {
      console.log('if part');
      const gptData = {
        businessRequest: req.body.businessRequest,
        globalSkill: req.body.globalSkill,
        localSkill: req.body.localSkill,
        softSkill: req.body.softSkill,
       product_id: req.body.product_id,  
      };
  
      console.log('line 182', gptData);
  
      const updateData = await ET_cart.ET_cart.update(gptData, {
        where: {
          businessRequest: businessRequest,
        },
      })
        .then(() => {
          console.log('sb shi chal rha h...');
        })
        .catch((err) => {
          console.log('line 362', err);
        });
      console.log('line 174', updateData);
      const message = 'Successfully updated';
      if (updateData == 0) {
        const message = 'Not updated because employee id is wrong.';
        res.send(new ResponseObject(500, message, false, updateData));
      } else {
        res.send(new ResponseObject(200, message, true, gptData));
      }
    } else {
      // console.log('line 196', employeeTwinID);
      console.log('line 176 else part');
      // const table = await employeeTwin.employeeTwin.sync();
      // const result = await table.findAll({
      //   where: {
      //     businessRequest: businessRequest,
      //   },
      // });
      // console.log("line 990",result);
      const tableCart = await ET_cart.ET_cart.sync();
      const cart = ET_cart.ET_cart.build({
        businessRequest: req.body.businessRequest,
        globalSkill: req.body.globalSkill,
        localSkill: req.body.localSkill,
        softSkill: req.body.softSkill,
       product_id: req.body.product_id,  
      });
      let getTwinMessage = 'Suceessfully craeted';
  
      const cartResponse = await cart.save();
      try {
        res.send(new ResponseObject(200, getTwinMessage, true, cartResponse));
      } catch (err) {
        console.error('err', err);
      }
    }
  });
  const purchasecartTwin = catchAsync(async (req, res, next) => {
    try {
        const { businessRequest} = req.body
        const table = await ET_cart.ET_cart.sync();
        const result = await table.findAll({
            where: { businessRequest: businessRequest 
                  
            }
        });
        console.log("line 224",result[0].globalSkill);
        console.log("line 224",result[0].localSkill);
        console.log("line 224",result[0].softSkill);
        const dataGlobal =result[0].globalSkill
    const dataLocal =result[0].localSkill
    const dataSoft =result[0].softSkill
     const dataProduct =result[0].product_id

    // console.log("line 117",dataGlobal)
    // console.log("line 117",dataLocal)
    // console.log("line 117",dataSoft)

    
const split_string_Global = dataGlobal.split(`,`);
console.log("line 118",split_string_Global)

const split_string_Local = dataLocal.split(`,`);
console.log("line 118",split_string_Local)

const split_string_soft = dataSoft.split(`,`);
console.log("line 118",split_string_soft)

const split_string_product = dataProduct.split(`,`);
console.log("line 1042",split_string_product)

const tableSoft = await softSkill.sync();
const resultSoft = await tableSoft.findAll({
    where: {
        softSkillID:split_string_soft,
    }
});
const tableProduct =  await products.sync();
const resultProduct = await tableProduct.findAll({
    where: {
        product_id:split_string_product,
    }
});
    
    const resultGlobal = await BotUser.Bot.findAll({
        where: {
            botExternalId:split_string_Global,
        }
    });

    const resultLocal = await BotUser.Bot.findAll({
        where: {
            botExternalId:split_string_Local,
        }
    });


    console.log("line 441",resultSoft);
    console.log("line 442",resultGlobal);
    console.log("line 442",resultLocal);

    res.status(200).json({
        LocalSkill:resultLocal,
        GlobalSkill:resultGlobal,
        softSkill:resultSoft,
        productids:resultProduct,   
     code:200
    })

        
    } catch (error) {
        console.log("line 227",error);
    }
})
const deletepurchaseCart = catchAsync(async (req, res, next) => {
    const table = await ET_cart.ET_cart.sync();
    let { businessRequest, skillID } = req.body;
    console.log("line 582....>>>", skillID);

    const result = await table.findAll({
        where: {
           
             businessRequest: businessRequest 
              
        }
    }).then(data => {
        console.log("line 589==>>>",data);
        let skill;
        if (req.path == '/globalSkill/deletepurchaseCart') {
            skill = data[0].globalSkill;
        } else if (req.path == '/localSkill/deletepurchaseCart') {
            skill = data[0].localSkill;
        } else if(req.path == '/softSkill/deletepurchaseCart'){
            skill = data[0].softSkill;
        }
         else if(req.path == '/product/deletepurchaseCart'){
            skill = data[0].product_id;
        }
        skill = skill.split(',');
        let globalSkill_arr = [];
        let value = true;
        skill.forEach((id, i) => {
            if (id != skillID) {
                globalSkill_arr.push(id)
;
            } else {
                value = false;
            }
        });
        if (value) {
            res.send(new ResponseObject(500, 'skill id not match', false));
        }
        globalSkill_arr = globalSkill_arr.toString();
        if (req.path == '/globalSkill/deletepurchaseCart') {
            let respose = ET_cart.ET_cart.update(
                { globalSkill: globalSkill_arr },
                { where: { 
                    businessRequest: businessRequest
                  } 
                }
            );
        } else if (req.path == '/localSkill/deletepurchaseCart') {
            let respose = ET_cart.ET_cart.update(
                { localSkill: globalSkill_arr },
                { where: {  businessRequest: businessRequest } }
            );
        }else if (req.path == '/softSkill/deletepurchaseCart'){
            let respose = ET_cart.ET_cart.update(
                { softSkill: globalSkill_arr },
                { where: { 
                    businessRequest: businessRequest }
                   }
            );
        }
else if (req.path == '/product/deletepurchaseCart'){
            let respose = ET_cart.ET_cart.update(
                { product_id: globalSkill_arr },
                { where: { 
                    businessRequest: businessRequest }
                   }
            );
        }
        res.send(new ResponseObject(200, 'Delete successfully', true));
    });
    
  

  });

//order mail data API
const orderMailData = catchAsync(async (req, res, next) => {
  try {
    const {orderID} = req.body;
console.log("orderID",orderID);
    const addData = await ET_order.ET_order.findOne({
      where: {
        orderID : orderID
      },
      raw: true
    });
console.log("addData",addData);
    let mailerObject = {
      randomData: addData,
      user: req.user,
      type: 'order mail',
    };
    await orderMail(mailerObject);
console.log("mailerObject",mailerObject);
    res.send(new ResponseObject(200, 'order mail api', true, addData));
  } catch (error) {
    res.status(400).send(error);
  }
});

  const searchSoftSkill=catchAsync(async(req,res,next)=>{
    try {
       const employeeTwinID = req.body.employeeTwinID
       let  epTable = await employeeTwin.employeeTwin.sync();
       const result = await epTable.findAll({
           where: {
               employeeTwinID: employeeTwinID
           }
        });
        console.log("line 233",result[0].softSkill);
       const dataValues = result.map((result) => result.dataValues);
       const idArray = dataValues.map(item => item.softSkill);
        console.log("line 180",idArray);
        const resultArray = idArray.flatMap(item => item.split(','));
        const tableSoft = await softSkill.sync();
        const resultSoft = await tableSoft.findAll({
          where: {
           softSkillID: resultArray,
          },
        });
   console.log("line 244",resultSoft);
       res.json({
           data: resultSoft,
           code:200
       })
   
    } catch (error) {
       res.status(501).json({
           data:error
       })
    }
   })


//product filter
   const getAreaProduct = catchAsync(async (req, res, next) => {
    try {
      const catalog_products = req.body.catalog_products;
      // const area = req.body.area;
  
      const table = await Product_cart.Product_cart.sync();
      const result2 = await table.findAll({});
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const product_id = dataValues.map((obj) => obj.product_id);
  
      // console.log('line 639', product_id);
      const originalListLocal = product_id;
      const newList = [];
      for (let i = 0; i < originalListLocal.length; i++) {
        const nestedList = originalListLocal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
      // console.log("line 652==>>",newList);
      const resultProduct = await products.findAll({
        where: {
          [Op.and]: [
            { product_id: newList },
            { catalog_products: catalog_products },
            // { area: area },
            // {subArea:"Demand Planning"}
          ],
        },
      });
      const dataValuesLocaal = resultProduct.map((result) => result.dataValues);
      console.log('line 766', dataValuesLocaal);
  
      const resultlocMap = dataValuesLocaal.map(({ product_id, product_title,catalog_products,subarea }) => ({ product_id, product_title,catalog_products,subarea }));
    
      res.status(200).json({
       productFilter:resultlocMap,
       code:200
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
      console.log('line 634', error);
    }
  });
  
  const getSubAreaProduct = catchAsync(async (req, res, next) => {
    try {
      const catalog_products = req.body.catalog_products;
      const subarea = req.body.subarea;
  console.log("line 1255==>>",catalog_products);
  console.log("line 1255==>>",subarea);
  
      const table = await Product_cart.Product_cart.sync();
      const result2 = await table.findAll({});
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const product_id = dataValues.map((obj) => obj.product_id);
  
      // console.log('line 639', product_id);
      const originalListLocal = product_id;
      const newList = [];
      for (let i = 0; i < originalListLocal.length; i++) {
        const nestedList = originalListLocal[i].split(',');
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
      // console.log("line 652==>>",newList);
      const resultProduct = await products.findAll({
        where: {
          [Op.and]: [
            { product_id: newList },
            { catalog_products: catalog_products },
            { subarea: subarea },
          ],
        },
      });
      const dataValuesLocaal = resultProduct.map((result) => result.dataValues);
      console.log('line 766', dataValuesLocaal);
  
      const resultlocMap = dataValuesLocaal.map(({ product_id, product_title,catalog_products,subarea}) => ({ product_id, product_title,catalog_products,subarea }));
    
      res.status(200).json({
       productFilter:resultlocMap,
       code:200
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
      console.log('line 634', error);
    }
  });

const getProductEmployeetwin =catchAsync(async (req,res,next)=>{
    try {
        const employeeTwinID =req.body.employeeTwinID;
    let  epTable = await employeeTwin.employeeTwin.sync();
    const result = await epTable.findAll({
        where: {
          employeeTwinID: employeeTwinID
        }
    });
    // console.log("line 143",result);
    const dataProduct = result[0].product_id;
    // console.log("line 145",dataProduct);
    const split_string_Product = dataProduct.split(`,`);
    console.log('line 118', split_string_Product);
    const tableSoft = await products.sync();
    const resultSoft = await tableSoft.findAll({
      where: {
        pid: split_string_Product,
      },
    });
  //  console.log("line 155",resultSoft);
  res.json({
    data: resultSoft,
    code:200
  })
       
    } catch (error) {
        res.json({
            data:error,
            code:error.code
        })
    }
  })

/* const getallSkillsByET = catchAsync(async (req, res, next) => {
    try {
        const table = await employeeTwin.employeeTwin.sync();
        const result2 = await table.findAll({
            where: {
                employeeTwinID: {
                    [Op.not]: req.query.empTwinId
                }
            }
          });
        const results = result2;
        const dataValues = results.map((result) => result.dataValues);
        const transactions = dataValues.map((obj) => obj.transactions);
        const reporting = dataValues.map((obj) => obj.reporting);
        const cognitive = dataValues.map((obj) => obj.cognitive);
        const decisionautomations = dataValues.map((obj) => obj.decisionautomations);
        const softSkills = dataValues.map((obj) => obj.softSkill);
        const productId = dataValues.map((obj) => obj.product_id);
  
        const originalListtransactions = transactions;
        const newList = [];
    
        for (let i = 0; i < originalListtransactions.length; i++) {
          const nestedList = originalListtransactions[i]?originalListtransactions[i].split(','):[];
          for (let j = 0; j < nestedList.length; j++) {
            newList.push(nestedList[j]);
          }
        }
    
        const originalListreporting = reporting;
        const newListGlo = [];
        for (let i = 0; i < originalListreporting.length; i++) {
          const nestedList = originalListreporting[i]?originalListreporting[i].split(','):[];
          for (let j = 0; j < nestedList.length; j++) {
            newListGlo.push(nestedList[j]);
          }
        }
        const originalListcognitive = cognitive;
        const newListCog = [];
        for (let i = 0; i < originalListcognitive.length; i++) {
          const nestedList = originalListcognitive[i]?originalListcognitive[i].split(','):[];
          for (let j = 0; j < nestedList.length; j++) {
            newListCog.push(nestedList[j]);
          }
        }
        const originalListdecisionautomations = decisionautomations;
        const newListDec = [];
        for (let i = 0; i < originalListdecisionautomations.length; i++) {
          const nestedList = originalListdecisionautomations[i]?originalListdecisionautomations[i].split(','):[];
          for (let j = 0; j < nestedList.length; j++) {
            newListDec.push(nestedList[j]);
          }
        }
    
   
        const originalListSoft = softSkills;
        const newListSoft = [];
        for (let i = 0; i < originalListSoft.length; i++) {
          const nestedList = originalListSoft[i]?originalListSoft[i].split(','):[];
          for (let j = 0; j < nestedList.length; j++) {
            newListSoft.push(nestedList[j]);
          }
        }
        
        const resultSoft = await softSkill.findAll({
          where: {
            softSkillID: newListSoft,
          },
        });
        const dataValuesSoft = resultSoft.map((result) => result.dataValues);
        const resultSoftMap = dataValuesSoft.map(
        ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
          botID:softSkillID,
          processName:skillName,
          processDescription:skillDescription,
          LeadPlatform:"",
          category:"Soft Skill",
          type:"softSkill",
          Twin:"",
          Tech:"Soft Skill",
          empTwinId:"",
          price:price,
          costType:costType,
        })
      );
        const resultTransaction = await BotUser.Bot.findAll({
          where: {
            botExternalId: newList,
          },
        });
        const dataValuesTransactions = resultTransaction.map((result) => result.dataValues);
        const resultTranMap = dataValuesTransactions.map(
          ({ botExternalId, processName, processDescription,leadPlatform,botID }) => ({
            botID:botExternalId,
            processName:processName,
            processDescription:processDescription,
            LeadPlatform:leadPlatform,
            category:"Transaction",
            type:"transactionalSkill",
            twin:"",
            tech:"Transactional",
            empTwinId:"",
            price:6,
	    costType:"Hour",
            id:botID
          })
        );

        const resultReporting = await BotUser.Bot.findAll({
          where: {
            botExternalId: newListGlo,
          },
        });
    
        const dataValuesReporting = resultReporting.map((result) => result.dataValues);
        const resultReportMap = dataValuesReporting.map(
          ({ botExternalId, processName, processDescription,leadPlatform,botID }) => ({
            botID:botExternalId,
            processName:processName,
            processDescription:processDescription,
            LeadPlatform:leadPlatform,
            category:"Reporting",
            type:"reportingSkills",
            twin:"",
            tech:"Reporting",
            empTwinId:"",
            price:6,
	    costType:"Hour",
            id:botID
          })
        );
        const resultCognitive = await BotUser.Bot.findAll({
          where: {
            botExternalId: newListCog,
          },
        });
        const dataValuesCognitive = resultCognitive.map((result) => result.dataValues);
        const resultCogMap = dataValuesCognitive.map(
          ({ botExternalId, processName,	processDescription,leadPlatform,botID }) => ({
            botID:botExternalId,
            processName:processName,
            processDescription:processDescription,
            LeadPlatform:leadPlatform,
            category:"Cognitive",
            type:"cognitiveSkills",
            twin:"",
            tech:"Cognitive",
            empTwinId:"",
            price:6,
	    costType:"Hour",
            id:botID
          })
        );
        const resultDecision = await BotUser.Bot.findAll({
          where: {
            botExternalId: newListDec,
          },
        });
        const dataValuesDecision = resultDecision.map((result) => result.dataValues);
        const resultDecMap = dataValuesDecision.map(
          ({ botExternalId, processName,processDescription,leadPlatform,botID}) => ({
            botID:botExternalId,
            processName:processName,
            processDescription:processDescription,
            LeadPlatform:leadPlatform,
            category:"Decision Automation",
            type:"decisionAutomationSkills",
            twin:"",
            tech:"Decision",
            empTwinId:"",
            price:6,
 	    costType:"Hour",
            id:botID
          })
        );
           // Calculate the average rating for each soft skill
    const averageRatings = {};
    const averageRatingsT = {};
    const averageRatingsR = {};
    const averageRatingsC = {};
    const averageRatingsD = {};
    for (const softSkillID of newListSoft) {
      const ratings = await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratings.length > 0) {
        const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const average = totalRating / ratings.length;
      
        if (!isNaN(average)) {
          averageRatings[softSkillID] = average;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatings[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatings[softSkillID] = 0; // Default to 0 if no ratings
      }
    }
    for (const softSkillID of newList) {
      const ratingsT = await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratingsT.length > 0) {
        const totalRatingT = ratingsT.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const averageT = totalRatingT / ratingsT.length;
      
        if (!isNaN(averageT)) {
          averageRatingsT[softSkillID] = averageT;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatingsT[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatingsT[softSkillID] = 0; // Default to 0 if no ratings
      }
    }
    for (const softSkillID of newListGlo) {
      const ratingsR = await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratingsR.length > 0) {
        const totalRatingR = ratingsR.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const averageR = totalRatingR / ratingsR.length;
      
        if (!isNaN(averageR)) {
          averageRatingsR[softSkillID] = averageR;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatingsR[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatingsR[softSkillID] = 0; // Default to 0 if no ratings
      }
    }
    for (const softSkillID of newListCog) {
      const ratingsC = await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratingsC.length > 0) {
        const totalRatingC = ratingsC.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const averageC = totalRatingC / ratingsC.length;
      
        if (!isNaN(averageC)) {
          averageRatingsC[softSkillID] = averageC;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatingsC[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatingsC[softSkillID] = 0; // Default to 0 if no ratings
      }
    }
    for (const softSkillID of newListDec) {
      const ratingsD= await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratingsD.length > 0) {
        const totalRatingD = ratingsD.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const averageD = totalRatingD / ratingsD.length;
      
        if (!isNaN(averageD)) {
          averageRatingsD[softSkillID] = averageD;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatingsD[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatingsD[softSkillID] = 0; // Default to 0 if no ratings
      }
    } 
   
    // Add the average rating to the soft skills in the response
    const resultSoftMapWithRatings = resultSoftMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatings[softSkill.botID].toFixed(1)), // Add average rating
    }));
    const resultTransMapWithRatings = resultTranMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatingsT[softSkill.botID].toFixed(1)), // Add average rating
    }));
    const resultRepMapWithRatings = resultReportMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatingsR[softSkill.botID].toFixed(1)), // Add average rating
    }));
    const resultCogMapWithRatings = resultCogMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatingsC[softSkill.botID].toFixed(1)), // Add average rating
    }));
    const resultDecMapWithRatings = resultDecMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatingsD[softSkill.botID].toFixed(1)), // Add average rating
    }));
    console.log("resultTransMapWithRatings",resultTransMapWithRatings)
    resultSoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    resultTransMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    resultRepMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    resultCogMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    resultDecMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
      const combinedData = [
          ...resultTransMapWithRatings,
          ...resultRepMapWithRatings,
          ...resultCogMapWithRatings,
          ...resultDecMapWithRatings,
          ...resultSoftMapWithRatings,
        ];      
	
   // Sort the combinedData array in descending order based on averageRating
      combinedData.sort((a, b) => b.averageRating - a.averageRating);

        if(combinedData.length === 0){
            res.send( new ResponseObject(404,`No Data Found `,false,'Error'));
        }
            res.send( new ResponseObject(200,`Successfully found skills data `,true,combinedData));
        
      } catch (error) {
        res.status(500).json({
          error: error.message,
        });
        console.log('line 634', error);
      }
  });*/


/*const getallSkillsByET = catchAsync(async (req, res, next) => {
  try {
      const table = await employeeTwin.employeeTwin.sync();
      const result2 = await table.findAll({
          where: {
              employeeTwinID: {
                  [Op.not]: req.query.empTwinId
              }
          }
        });
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const transactions = dataValues.map((obj) => obj.transactions);
      const reporting = dataValues.map((obj) => obj.reporting);
      const cognitive = dataValues.map((obj) => obj.cognitive);
      const decisionautomations = dataValues.map((obj) => obj.decisionautomations);
      const softSkills = dataValues.map((obj) => obj.softSkill);
      const productId = dataValues.map((obj) => obj.product_id);
      const genAI = dataValues.map((obj) => obj.genAi);
      

      const originalListtransactions = transactions;
      const newList = [];
  
      for (let i = 0; i < originalListtransactions.length; i++) {
        const nestedList = originalListtransactions[i]?originalListtransactions[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
  
      const originalListreporting = reporting;
      const newListGlo = [];
      for (let i = 0; i < originalListreporting.length; i++) {
        const nestedList = originalListreporting[i]?originalListreporting[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListGlo.push(nestedList[j]);
        }
      }
      const originalListcognitive = cognitive;
      const newListCog = [];
      for (let i = 0; i < originalListcognitive.length; i++) {
        const nestedList = originalListcognitive[i]?originalListcognitive[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListCog.push(nestedList[j]);
        }
      }
      const originalListdecisionautomations = decisionautomations;
      const newListDec = [];
      for (let i = 0; i < originalListdecisionautomations.length; i++) {
        const nestedList = originalListdecisionautomations[i]?originalListdecisionautomations[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListDec.push(nestedList[j]);
        }
      }
  

      const originalListSoft = softSkills;
      const newListSoft = [];
      for (let i = 0; i < originalListSoft.length; i++) {
        const nestedList = originalListSoft[i]?originalListSoft[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListSoft.push(nestedList[j]);
        }
      }


      const originalListGenAI = genAI
      const newListGenAIBot = [];
      const newListGenAISoft = []
      for (let i = 0; i < originalListGenAI.length; i++) {
        const nestedList = originalListGenAI[i]?originalListGenAI[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {

          let genAiValue = nestedList[j]

          if(genAiValue[0] == "S"){
            newListGenAISoft.push(genAiValue)
          }else{
            newListGenAIBot.push(genAiValue)
          }    
        }
      }

      const resultGenAISoft = await softSkill.findAll({
        where: {
          softSkillID: newListGenAISoft,
        },
      })
      const dataValuesGenAISoft = resultGenAISoft.map((result) => result.dataValues);
      const resultGenAISoftMap = dataValuesGenAISoft.map(
        ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
          botID:softSkillID,
          processName:skillName,
          processDescription:skillDescription,
          LeadPlatform:"",
          category:"Gen AI",
          type:"Gen AI Skill",
          twin:"",
          tech:"Gen AI",
          empTwinId:"",
          price:price,
          costType:costType
        })
      );

      const resultGenAIBot = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListGenAIBot,
        },
      });
      const dataValuesGenAIBot = resultGenAIBot.map((result) => result.dataValues);
      const resultGenAIBotMap = dataValuesGenAIBot.map(
        ({ botExternalId, processName,	processDescription,leadPlatform,botID}) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Gen AI",
          type:"Gen AI Skill",
          twin:"",
          tech:"Gen AI",
          empTwinId:"",
          price:499,
          costType:"Hour",
          id:botID
        })
      );

      
      const resultSoft = await softSkill.findAll({
        where: {
          softSkillID: newListSoft,
        },
      });
      const dataValuesSoft = resultSoft.map((result) => result.dataValues);
      const resultSoftMap = dataValuesSoft.map(
        ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
          botID:softSkillID,
          processName:skillName,
          processDescription:skillDescription,
          category:"Soft Skill",
          type:"softSkill",
          twin:"",
          tech:"Soft Skill",
          empTwinId:"",
          price:price,
          LeadPlatform:"",
          costType:costType
        })
      );
      const resultTransaction = await BotUser.Bot.findAll({
        where: {
          botExternalId: newList,
        },
      });
      const dataValuesTransactions = resultTransaction.map((result) => result.dataValues);
      const resultTranMap = dataValuesTransactions.map(
        ({ botExternalId, processName,	processDescription,leadPlatform, botID}) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Transaction",
          type:"transactionalSkill",
          twin:"",
          tech:"Transactional",
          empTwinId:"",
          price:499,
          costType:"Hour",
          id:botID
        })
      );

      const resultReporting = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListGlo,
        },
      });
  
      const dataValuesReporting = resultReporting.map((result) => result.dataValues);
      const resultReportMap = dataValuesReporting.map(
        ({ botExternalId, processName, processDescription,leadPlatform,botID }) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Reporting",
          type:"reportingSkills",
          twin:"",
          tech:"Reporting",
          empTwinId:"",
          price:499,
          costType:"Hour",
          id:botID
        })
      );
      const resultCognitive = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListCog,
        },
      });
      const dataValuesCognitive = resultCognitive.map((result) => result.dataValues);
      const resultCogMap = dataValuesCognitive.map(
        ({ botExternalId, processName,	processDescription,leadPlatform, botID}) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Cognitive",
          type:"cognitiveSkills",
          twin:"",
          tech:"Cognitive",
          empTwinId:"",
          price:499,
          costType:"Hour",
          id:botID
        })
      );
      const resultDecision = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListDec,
        },
      });
      const dataValuesDecision = resultDecision.map((result) => result.dataValues);
      const resultDecMap = dataValuesDecision.map(
        ({ botExternalId, processName,processDescription,leadPlatform,botID}) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Decision Automation",
          type:"decisionAutomationSkills",
          twin:"",
          tech:"Decision",
          empTwinId:"",
          price:499,
          costType:"Hour",
          id:botID
        })
      );
       // Calculate the average rating for each soft skill
  const averageRatings = {};
  const averageRatingsT = {};
  const averageRatingsR = {};
  const averageRatingsC = {};
  const averageRatingsD = {};
  const averageRatingGB = {};
  const averageRatingGS = {};


  for (const softSkillID of newListGenAIBot) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatingGB[softSkillID] = average;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingGB[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingGB[softSkillID] = 0; // Default to 0 if no ratings
    }
  }

  for (const softSkillID of newListGenAISoft) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatingGS[softSkillID] = average;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingGS[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingGS[softSkillID] = 0; // Default to 0 if no ratings
    }
  }


  for (const softSkillID of newListSoft) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatings[softSkillID] = average;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatings[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatings[softSkillID] = 0; // Default to 0 if no ratings
    }
  }
  for (const softSkillID of newList) {
    const ratingsT = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsT.length > 0) {
      const totalRatingT = ratingsT.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageT = totalRatingT / ratingsT.length;
    
      if (!isNaN(averageT)) {
        averageRatingsT[softSkillID] = averageT;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsT[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsT[softSkillID] = 0; // Default to 0 if no ratings
    }
  }
  for (const softSkillID of newListGlo) {
    const ratingsR = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsR.length > 0) {
      const totalRatingR = ratingsR.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageR = totalRatingR / ratingsR.length;
    
      if (!isNaN(averageR)) {
        averageRatingsR[softSkillID] = averageR;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsR[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsR[softSkillID] = 0; // Default to 0 if no ratings
    }
  }
  for (const softSkillID of newListCog) {
    const ratingsC = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsC.length > 0) {
      const totalRatingC = ratingsC.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageC = totalRatingC / ratingsC.length;
    
      if (!isNaN(averageC)) {
        averageRatingsC[softSkillID] = averageC;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsC[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsC[softSkillID] = 0; // Default to 0 if no ratings
    }
  }
  for (const softSkillID of newListDec) {
    const ratingsD= await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsD.length > 0) {
      const totalRatingD = ratingsD.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageD = totalRatingD / ratingsD.length;
    
      if (!isNaN(averageD)) {
        averageRatingsD[softSkillID] = averageD;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsD[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsD[softSkillID] = 0; // Default to 0 if no ratings
    }
  }

  // Add the average rating to the soft skills in the response

  const resultGenAIBotMapWithRatings = resultGenAIBotMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingGB[softSkill.botID], // Add average rating
  }));

  const resultGenAISoftMapWithRatings = resultGenAISoftMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingGS[softSkill.botID], // Add average rating
  }));

  const resultSoftMapWithRatings = resultSoftMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatings[softSkill.botID], // Add average rating
  }));
  const resultTransMapWithRatings = resultTranMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsT[softSkill.botID], // Add average rating
  }));
  const resultRepMapWithRatings = resultReportMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsR[softSkill.botID], // Add average rating
  }));
  const resultCogMapWithRatings = resultCogMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsC[softSkill.botID], // Add average rating
  }));
  const resultDecMapWithRatings = resultDecMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsD[softSkill.botID], // Add average rating
  }));
  console.log("resultTransMapWithRatings",resultTransMapWithRatings)


  resultGenAIBotMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultGenAISoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultSoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultTransMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultRepMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultCogMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultDecMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    const data = [
        ...resultTransMapWithRatings,
        ...resultRepMapWithRatings,
        ...resultCogMapWithRatings,
        ...resultDecMapWithRatings,
        ...resultSoftMapWithRatings,
        ...resultGenAISoftMapWithRatings,
        ...resultGenAIBotMapWithRatings
      ];
    
      
      if(data.length === 0){
          res.send( new ResponseObject(404,`No Data Found `,false,'Error'));
      }
          res.send( new ResponseObject(200,`Successfully found skills data `,true,data));
      
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
      console.log('line 634', error);
    }
}); */

const getallSkillsByET = catchAsync(async (req, res, next) => {
  try {
      const table = await employeeTwin.employeeTwin.sync();
      const result2 = await table.findAll({
          where: {
              employeeTwinID: {
                  [Op.not]: req.query.empTwinId
              }
          }
        });
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const transactions = dataValues.map((obj) => obj.transactions);
      const reporting = dataValues.map((obj) => obj.reporting);
      const cognitive = dataValues.map((obj) => obj.cognitive);
      const decisionautomations = dataValues.map((obj) => obj.decisionautomations);
      const softSkills = dataValues.map((obj) => obj.softSkill);
      const productId = dataValues.map((obj) => obj.product_id);
      const genAI = dataValues.map((obj) => obj.genAi);
      

      const originalListtransactions = transactions;
      const newList = [];
  
      for (let i = 0; i < originalListtransactions.length; i++) {
        const nestedList = originalListtransactions[i]?originalListtransactions[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
  
      const originalListreporting = reporting;
      const newListGlo = [];
      for (let i = 0; i < originalListreporting.length; i++) {
        const nestedList = originalListreporting[i]?originalListreporting[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListGlo.push(nestedList[j]);
        }
      }
      const originalListcognitive = cognitive;
      const newListCog = [];
      for (let i = 0; i < originalListcognitive.length; i++) {
        const nestedList = originalListcognitive[i]?originalListcognitive[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListCog.push(nestedList[j]);
        }
      }
      const originalListdecisionautomations = decisionautomations;
      const newListDec = [];
      for (let i = 0; i < originalListdecisionautomations.length; i++) {
        const nestedList = originalListdecisionautomations[i]?originalListdecisionautomations[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListDec.push(nestedList[j]);
        }
      }
  

      const originalListSoft = softSkills;
      const newListSoft = [];
      for (let i = 0; i < originalListSoft.length; i++) {
        const nestedList = originalListSoft[i]?originalListSoft[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListSoft.push(nestedList[j]);
        }
      }


      const originalListGenAI = genAI
      const newListGenAIBot = [];
      const newListGenAISoft = []
      for (let i = 0; i < originalListGenAI.length; i++) {
        const nestedList = originalListGenAI[i]?originalListGenAI[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {

          let genAiValue = nestedList[j]

          if(genAiValue[0] == "S"){
            newListGenAISoft.push(genAiValue)
          }else{
            newListGenAIBot.push(genAiValue)
          }    
        }
      }

      const resultGenAISoft = await softSkill.findAll({
        where: {
          softSkillID: newListGenAISoft,
        },
      })
      const dataValuesGenAISoft = resultGenAISoft.map((result) => result.dataValues);
      const resultGenAISoftMap = dataValuesGenAISoft.map(
        ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
          botID:softSkillID,
          processName:skillName,
          processDescription:skillDescription,
          LeadPlatform:"",
          category:"Gen AI",
          type:"Gen AI Skill",
          twin:"",
          tech:"Gen AI",
          empTwinId:"",
          price:price,
          costType:costType
        })
      );

      const resultGenAIBot = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListGenAIBot,
        },
      });
      const dataValuesGenAIBot = resultGenAIBot.map((result) => result.dataValues);
      const resultGenAIBotMap = dataValuesGenAIBot.map(
        ({ botExternalId, processName,	processDescription,leadPlatform,botID}) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Gen AI",
          type:"Gen AI Skill",
          twin:"",
          tech:"Gen AI",
          empTwinId:"",
          price:6,
          costType:"Hour",
          id:botID
        })
      );

      
      const resultSoft = await softSkill.findAll({
        where: {
          softSkillID: newListSoft,
        },
      });
      const dataValuesSoft = resultSoft.map((result) => result.dataValues);
      const resultSoftMap = dataValuesSoft.map(
        ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
          botID:softSkillID,
          processName:skillName,
          processDescription:skillDescription,
          category:"Soft Skill",
          type:"softSkill",
          twin:"",
          tech:"Soft Skill",
          empTwinId:"",
          price:price,
          LeadPlatform:"",
          costType:costType
        })
      );
      const resultTransaction = await BotUser.Bot.findAll({
        where: {
          botExternalId: newList,
        },
      });
      const dataValuesTransactions = resultTransaction.map((result) => result.dataValues);
      const resultTranMap = dataValuesTransactions.map(
        ({ botExternalId, processName,	processDescription,leadPlatform, botID}) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Transaction",
          type:"transactionalSkill",
          twin:"",
          tech:"Transactional",
          empTwinId:"",
          price:6,
          costType:"Hour",
          id:botID
        })
      );

      const resultReporting = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListGlo,
        },
      });
  
      const dataValuesReporting = resultReporting.map((result) => result.dataValues);
      const resultReportMap = dataValuesReporting.map(
        ({ botExternalId, processName, processDescription,leadPlatform,botID }) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Reporting",
          type:"reportingSkills",
          twin:"",
          tech:"Reporting",
          empTwinId:"",
          price:6,
          costType:"Hour",
          id:botID
        })
      );
      const resultCognitive = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListCog,
        },
      });
      const dataValuesCognitive = resultCognitive.map((result) => result.dataValues);
      const resultCogMap = dataValuesCognitive.map(
        ({ botExternalId, processName,	processDescription,leadPlatform, botID}) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Cognitive",
          type:"cognitiveSkills",
          twin:"",
          tech:"Cognitive",
          empTwinId:"",
          price:6,
          costType:"Hour",
          id:botID
        })
      );
      const resultDecision = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListDec,
        },
      });
      const dataValuesDecision = resultDecision.map((result) => result.dataValues);
      const resultDecMap = dataValuesDecision.map(
        ({ botExternalId, processName,processDescription,leadPlatform,botID}) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Decision Automation",
          type:"decisionAutomationSkills",
          twin:"",
          tech:"Decision",
          empTwinId:"",
          price:6,
          costType:"Hour",
          id:botID
        })
      );
       // Calculate the average rating for each soft skill
  const averageRatings = {};
  const countRatings = {};

  const averageRatingsT = {};
  const countRatingsT = {};

  const averageRatingsR = {};
  const countRatingsR = {};

  const averageRatingsC = {};
  const countRatingsC = {};

  const averageRatingsD = {};
  const countRatingsD = {};

  const averageRatingGB = {};
  const countRatingGB = {};

  const averageRatingGS = {};
  const countRatingGS = {};



  for (const softSkillID of newListGenAIBot) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatingGB[softSkillID] = average;
        countRatingGB[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingGB[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingGB[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingGB[softSkillID] = 0; // Default to 0 if no ratings
      countRatingGB[softSkillID] = 0; // Default to 0 if no ratings
    }
  }

  for (const softSkillID of newListGenAISoft) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatingGS[softSkillID] = average;
        countRatingGS[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingGS[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingGS[softSkillID] = 0; // Default to 0 if no valid ratings

      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingGS[softSkillID] = 0; // Default to 0 if no ratings
      countRatingGS[softSkillID] = 0;
    }
  }


  for (const softSkillID of newListSoft) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatings[softSkillID] = average;
        countRatings[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatings[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatings[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatings[softSkillID] = 0; // Default to 0 if no ratings
      countRatings[softSkillID] = 0;
    }
  }
  for (const softSkillID of newList) {
    const ratingsT = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });
    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsT.length > 0) {
      const totalRatingT = ratingsT.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageT = totalRatingT / ratingsT.length;
    
      if (!isNaN(averageT)) {
        averageRatingsT[softSkillID] = averageT;
        countRatingsT[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsT[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingsT[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsT[softSkillID] = 0; // Default to 0 if no ratings
      countRatingsT[softSkillID] = 0;
    }
  }
  for (const softSkillID of newListGlo) {
    const ratingsR = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });
    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsR.length > 0) {
      const totalRatingR = ratingsR.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageR = totalRatingR / ratingsR.length;
    
      if (!isNaN(averageR)) {
        averageRatingsR[softSkillID] = averageR;
        countRatingsR[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsR[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingsR[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsR[softSkillID] = 0; // Default to 0 if no ratings
      countRatingsR[softSkillID] = 0;
    }
  }
  for (const softSkillID of newListCog) {
    const ratingsC = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });
    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsC.length > 0) {
      const totalRatingC = ratingsC.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageC = totalRatingC / ratingsC.length;
    
      if (!isNaN(averageC)) {
        averageRatingsC[softSkillID] = averageC;
        countRatingsC[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsC[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingsC[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsC[softSkillID] = 0; // Default to 0 if no ratings
      countRatingsC[softSkillID] = 0;
    }
  }
  for (const softSkillID of newListDec) {
    const ratingsD= await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });
    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsD.length > 0) {
      const totalRatingD = ratingsD.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageD = totalRatingD / ratingsD.length;
    
      if (!isNaN(averageD)) {
        averageRatingsD[softSkillID] = averageD;
        countRatingsD[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsD[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingsD[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsD[softSkillID] = 0; // Default to 0 if no ratings
      countRatingsD[softSkillID] = 0;
    }
  }

  // Add the average rating to the soft skills in the response

  const resultGenAIBotMapWithRatings = resultGenAIBotMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingGB[softSkill.botID], // Add average rating
    countRatings: countRatingGB[softSkill.botID], // Add number of ratings
  }));

  const resultGenAISoftMapWithRatings = resultGenAISoftMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingGS[softSkill.botID], // Add average rating
    countRatings: countRatingGS[softSkill.botID], // Add number of ratings
  }));

  const resultSoftMapWithRatings = resultSoftMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatings[softSkill.botID], // Add average rating
    countRatings: countRatings[softSkill.botID], // Add number of ratings
  }));
  const resultTransMapWithRatings = resultTranMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsT[softSkill.botID], // Add average rating
    countRatings: countRatingsT[softSkill.botID], // Add number of ratings
  }));
  const resultRepMapWithRatings = resultReportMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsR[softSkill.botID], // Add average rating
    countRatings: countRatingsR[softSkill.botID], // Add number of ratings
  }));
  const resultCogMapWithRatings = resultCogMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsC[softSkill.botID], // Add average rating
    countRatings: countRatingsC[softSkill.botID], // Add number of ratings
  }));
  const resultDecMapWithRatings = resultDecMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsD[softSkill.botID], // Add average rating
    countRatings: countRatingsD[softSkill.botID], // Add number of ratings
  }));
  console.log("resultTransMapWithRatings",resultTransMapWithRatings)


  resultGenAIBotMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultGenAISoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultSoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultTransMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultRepMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultCogMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultDecMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    const data = [
        ...resultTransMapWithRatings,
        ...resultRepMapWithRatings,
        ...resultCogMapWithRatings,
        ...resultDecMapWithRatings,
        ...resultSoftMapWithRatings,
        ...resultGenAISoftMapWithRatings,
        ...resultGenAIBotMapWithRatings
      ];
    
      
      if(data.length === 0){
          res.send( new ResponseObject(404,`No Data Found `,false,'Error'));
      }
          res.send( new ResponseObject(200,`Successfully found skills data `,true,data));
      
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
      console.log('line 634', error);
    }
}); 



 
{/*
const searchTwin2 = catchAsync(async (req, res, next) => {
  // console.log("line 415 searchTwin ",req.query.empTwinId);
  const table = await employeeTwin.employeeTwin.sync();
  const result = await table.findAll({
      where: {
          employeeTwinID: req.query.empTwinId
      }
  });
  const data =result[0].softSkill
//   console.log("line 117",data)

  let allData=result

const split_string = data.split(`,`);
// console.log("line 118",split_string)

  const tableSoft = await softSkill.sync();
  const resultSoft = await tableSoft.findAll({
      where: {
          softSkillID:split_string,
        }
      });
      // console.log("line 125",resultSoft);
       const sId  = resultSoft.map((result) => result.softSkillID);
       const sDes = resultSoft.map((result) => result.skillDescription);
       const sCat = resultSoft.map((result) => result.category);
  
       const extractedSoftSkillIDs = resultSoft.map(item => {
        return { botExternalId: item.softSkillID, processName: item.skillName ,estimatedDeliveryDate:'', processDescription:item.skillDescription, botID:item.softSkillID, category: item.category };

        });
  
      let searchTwinMessage = 'Suceessfully Found';
  
  
      if (resultSoft.length <= 0) {
          searchTwinMessage = 'Not found';
          res.send(new ResponseObject(500, searchTwinMessage, true));
      }
      try {
        // res.send(new ResponseObject(200, searchTwinMessage, true, resultSoft,allData));
        console.log("line 122",allData);
        res.status(200).json({
            message:searchTwinMessage,
            data:extractedSoftSkillIDs,
             code:200
        })
    } catch (err) {
        console.error('err', err);
    }
});
*/}
const searchTwin2 = catchAsync(async (req, res, next) => {
  // console.log("line 415 searchTwin ",req.query.empTwinId);
  const table = await employeeTwin.employeeTwin.sync();
  const result = await table.findAll({
      where: {
          employeeTwinID: req.query.empTwinId
      }
  });
  const data =result[0].softSkill
//   console.log("line 117",data)

  let allData=result

const split_string = data.split(`,`);
// console.log("line 118",split_string)

  const tableSoft = await softSkill.sync();
  const resultSoft = await tableSoft.findAll({
      where: {
          softSkillID:split_string,
        }
      });
      // console.log("line 125",resultSoft);

  
       const extractedSoftSkillIDs = resultSoft.map(item => {
        return { botExternalId: item.softSkillID, processName: item.skillName ,estimatedDeliveryDate:'', processDescription:item.skillDescription, botID:item.softSkillID, category: item.category };

        });
  
      let searchTwinMessage = 'Suceessfully Found';
      const averageRatings = {};
      for (const softSkillID of split_string) {
        const ratingsS= await skillRatings.findAll({
          where: {
            softSkillID: softSkillID,
          },
        });
  
        if (ratingsS.length > 0) {
          const totalRatingS = ratingsS.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
          const averageS = totalRatingS / ratingsS.length;
        
          if (!isNaN(averageS)) {
            averageRatings[softSkillID] = averageS;
          } else {
            // Handle the case where the average is NaN (e.g., no valid ratings)
            averageRatings[softSkillID] = 0; // Default to 0 if no valid ratings
          }
        } else {
          // Handle the case where there are no ratings at all
          averageRatings[softSkillID] = 0; // Default to 0 if no ratings
        }
      }
      const resultsoftWithRatings = extractedSoftSkillIDs.map((softSkill) => ({
        ...softSkill,
        averageRating: parseFloat(averageRatings[softSkill.botID].toFixed(1)), // Add average rating
      }));
      resultsoftWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  
      if (resultSoft.length <= 0) {
          searchTwinMessage = 'Not found';
          res.send(new ResponseObject(500, searchTwinMessage, true));
      }
      try {
        // res.send(new ResponseObject(200, searchTwinMessage, true, resultSoft,allData));
        console.log("line 122",allData);
        res.status(200).json({
            message:searchTwinMessage,
            data:resultsoftWithRatings,
             code:200
        })
    } catch (err) {
        console.error('err', err);
    }
});

  const virtualDeleteApi = catchAsync(async(req,res,next)=>{
    try {
        const table = await Cost_per_Skill.sync();
        let { botID,ETID, Month } = req.body;
        const result = await table.findAll({
            where: {
                [Op.and]: [
                    { botID: botID },
                    { ETID: ETID },
                  ]
            }
        });
        console.log("line 1572",result)
        if(result.length>=1){
            const deleteCostUser = await deleteCostUseret.sync();
            // let { botID, ETID, status} = req.body;
            const cart =deleteCostUser.build({
                botID:botID, 
                ETID:ETID, 
                status:"1", 
              });
              const cartResponse = await cart.save();
              res.status(201).json({
                data: cartResponse
              })
              
        }else{
            const deleteCostUser = await deleteCostUseret.sync();
            const cart =deleteCostUser.build({
                botID:botID, 
                ETID:ETID, 
                status:"0", 
              });
              const cartResponse = await cart.save();
              res.status(201).json({
                data: cartResponse
              })
        }
     

    } catch (error) {
      console.log("delete api error",error);
        res.json({
        err:error
        })
    }
  });

/*Get soft skill, transaction,reporting,cognitive,decision automation in single api according to ET wise*/


/* //14 nov const getTwinDataByET = catchAsync(async (req, res, next) => {
  try {
    const table = await employeeTwin.employeeTwin.sync();
    const result2 = await table.findAll({
    //   where: {
    //     employeeTwinID: req.query.empTwinId
    // }

    });
    const results = result2;
    const dataValues = results.map((result) => result.dataValues);
    const transactions = dataValues.map((obj) => obj.transactions);
    const reporting = dataValues.map((obj) => obj.reporting);
    const cognitive = dataValues.map((obj) => obj.cognitive);
    const decisionautomations = dataValues.map((obj) => obj.	decisionautomations);
    const softSkills = dataValues.map((obj) => obj.softSkill);
    const productId = dataValues.map((obj) => obj.product_id);
    const genAI = dataValues.map((obj) => obj.genAi);

 
    const originalListtransactions = transactions;
    const newList = [];

    for (let i = 0; i < originalListtransactions.length; i++) {
      const nestedList = originalListtransactions[i]?originalListtransactions[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newList.push(nestedList[j]);
      }
    }

    const originalListreporting = reporting;
    const newListGlo = [];
    for (let i = 0; i < originalListreporting.length; i++) {
      const nestedList = originalListreporting[i]?originalListreporting[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListGlo.push(nestedList[j]);
      }
    }
    const originalListcognitive = cognitive;
    const newListCog = [];
    for (let i = 0; i < originalListcognitive.length; i++) {
      const nestedList = originalListcognitive[i]?originalListcognitive[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListCog.push(nestedList[j]);
      }
    }
    const originalListdecisionautomations = decisionautomations;
    const newListDec = [];
    for (let i = 0; i < originalListdecisionautomations.length; i++) {
      const nestedList = originalListdecisionautomations[i]?originalListdecisionautomations[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListDec.push(nestedList[j]);
      }
    }

    const originalListSoft = softSkills;
    const newListSoft = [];
    for (let i = 0; i < originalListSoft.length; i++) {
      const nestedList = originalListSoft[i]?originalListSoft[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListSoft.push(nestedList[j]);
      }
    }
    const originalListGenAI = genAI
    const newListGenAIBot = [];
    const newListGenAISoft = []
    for (let i = 0; i < originalListGenAI.length; i++) {
      const nestedList = originalListGenAI[i]?originalListGenAI[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {

        let genAiValue = nestedList[j]

        if(genAiValue[0] == "S"){
          newListGenAISoft.push(genAiValue)
        }else{
          newListGenAIBot.push(genAiValue)
        }    
      }
    }

    const resultGenAISoft = await softSkill.findAll({
      where: {
        softSkillID: newListGenAISoft,
      },
    })
    const dataValuesGenAISoft = resultGenAISoft.map((result) => result.dataValues);
    const resultGenAISoftMap = dataValuesGenAISoft.map(
      ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
        botID:softSkillID,
        processName:skillName,
        processDescription:skillDescription,
        LeadPlatform:"",
        category:"Gen AI",
        type:"Gen AI Skill",
        Twin:"",
        Tech:"Gen AI",
        empTwinId:"",
        price:price,
        costType:costType
      })
    );

    const resultGenAIBot = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListGenAIBot,
      },
    });
    const dataValuesGenAIBot = resultGenAIBot.map((result) => result.dataValues);
    const resultGenAIBotMap = dataValuesGenAIBot.map(
      ({ botExternalId, processName,	processDescription,leadPlatform,botID}) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Gen AI",
        type:"Gen AI Skill",
        Twin:"",
        Tech:"Gen AI",
        empTwinId:"",
        price:499,
        id:botID
      })
    );

    
    const resultSoft = await softSkill.findAll({
      where: {
        softSkillID: newListSoft,
      },
    });
    const dataValuesSoft = resultSoft.map((result) => result.dataValues);
    const resultSoftMap = dataValuesSoft.map(
      ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
        botID:softSkillID,
        processName:skillName,
        processDescription:skillDescription,
        LeadPlatform:"",
        category:"Soft Skill",
        type:"softSkill",
        Twin:"",
        Tech:"Soft Skill",
        empTwinId:"",
        price:price,
        costType:costType
      })
    );
    const resultTransaction = await BotUser.Bot.findAll({
      where: {
        botExternalId: newList,
      },
    });
    const dataValuesTransactions = resultTransaction.map((result) => result.dataValues);
    const resultTranMap = dataValuesTransactions.map(
      ({ botExternalId, processName,	processDescription,leadPlatform,botID}) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Transaction",
        type:"transactionalSkill",
        Twin:"",
        Tech:"Transactional",
        empTwinId:"",
        price:499,
        id:botID
      })
    );

    const resultReporting = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListGlo,
      },
    });

    const dataValuesReporting = resultReporting.map((result) => result.dataValues);
    const resultReportMap = dataValuesReporting.map(
      ({ botExternalId, processName, processDescription,leadPlatform,botID }) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Reporting",
        type:"reportingSkills",
        Twin:"",
        Tech:"Reporting",
        empTwinId:"",
        price:499,
        id:botID
      })
    );
    const resultCognitive = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListCog,
      },
    });
    const dataValuesCognitive = resultCognitive.map((result) => result.dataValues);
    const resultCogMap = dataValuesCognitive.map(
      ({ botExternalId, processName,	processDescription,leadPlatform,botID }) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Cognitive",
        type:"cognitiveSkills",
        Twin:"",
        Tech:"Cognitive",
        empTwinId:"",
        price:499,
        id:botID
      })
    );
    const resultDecision = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListDec,
      },
    });
    const dataValuesDecision = resultDecision.map((result) => result.dataValues);
    const resultDecMap = dataValuesDecision.map(
      ({ botExternalId, processName,processDescription,leadPlatform,botID}) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Decision Automation",
        type:"decisionAutomationSkills",
        Twin:"",
        Tech:"Decision",
        empTwinId:"",
        price:499,
        id:botID
      })
    );
    const dt=resultTranMap;

    // Calculate the average rating for each soft skill
    
    const table1 = await skillRatings.sync();
  const averageRatings = {};
  const averageRatingsT = {};
  const averageRatingsR = {};
  const averageRatingsC = {};
  const averageRatingsD = {};
  const averageRatingGB = {};
  const averageRatingGS = {};

  for (const softSkillID of newListGenAIBot) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatingGB[softSkillID] = average;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingGB[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingGB[softSkillID] = 0; // Default to 0 if no ratings
    }
  }

  for (const softSkillID of newListGenAISoft) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatingGS[softSkillID] = average;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingGS[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingGS[softSkillID] = 0; // Default to 0 if no ratings
    }
  }


  for (const softSkillID of newListSoft) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatings[softSkillID] = average;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatings[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatings[softSkillID] = 0; // Default to 0 if no ratings
    }
  }

  for (const softSkillID of newList) {
    const ratingsT = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsT.length > 0) {
      const totalRatingT = ratingsT.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageT = totalRatingT / ratingsT.length;
    
      if (!isNaN(averageT)) {
        averageRatingsT[softSkillID] = averageT;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsT[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsT[softSkillID] = 0; // Default to 0 if no ratings
    }
  }
  for (const softSkillID of newListGlo) {
    const ratingsR = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsR.length > 0) {
      const totalRatingR = ratingsR.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageR = totalRatingR / ratingsR.length;
    
      if (!isNaN(averageR)) {
        averageRatingsR[softSkillID] = averageR;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsR[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsR[softSkillID] = 0; // Default to 0 if no ratings
    }
  }
  for (const softSkillID of newListCog) {
    const ratingsC = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsC.length > 0) {
      const totalRatingC = ratingsC.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageC = totalRatingC / ratingsC.length;
    
      if (!isNaN(averageC)) {
        averageRatingsC[softSkillID] = averageC;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsC[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsC[softSkillID] = 0; // Default to 0 if no ratings
    }
  }
  for (const softSkillID of newListDec) {
    const ratingsD= await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsD.length > 0) {
      const totalRatingD = ratingsD.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageD = totalRatingD / ratingsD.length;
    
      if (!isNaN(averageD)) {
        averageRatingsD[softSkillID] = averageD;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsD[softSkillID] = 0; // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsD[softSkillID] = 0; // Default to 0 if no ratings
    }
  }

  // Add the average rating to the soft skills in the response
  
  const resultGenAIBotMapWithRatings = resultGenAIBotMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingGB[softSkill.botID], // Add average rating
  }));

  const resultGenAISoftMapWithRatings = resultGenAISoftMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingGS[softSkill.botID], // Add average rating
  }));

  const resultSoftMapWithRatings = resultSoftMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatings[softSkill.botID], // Add average rating
  }));
  const resultTransMapWithRatings = resultTranMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsT[softSkill.botID], // Add average rating
  }));
  const resultRepMapWithRatings = resultReportMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsR[softSkill.botID], // Add average rating
  }));
  const resultCogMapWithRatings = resultCogMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsC[softSkill.botID], // Add average rating
  }));
  const resultDecMapWithRatings = resultDecMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsD[softSkill.botID], // Add average rating
  }));
  console.log("resultTransMapWithRatings",resultTransMapWithRatings)
  resultGenAIBotMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultGenAISoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultSoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultTransMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultRepMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultCogMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultDecMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    const data = [
        ...resultTransMapWithRatings,
        ...resultRepMapWithRatings,
        ...resultCogMapWithRatings,
        ...resultDecMapWithRatings,
        ...resultSoftMapWithRatings,
        ...resultGenAISoftMapWithRatings,
        ...resultGenAIBotMapWithRatings
      ];
    

    res.status(200).json({
      data:data,
      code: 200,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
    console.log('line 634', error);
  }
}); */

//new 16 API
const getTwinDataByET = catchAsync(async (req, res, next) => {
  try {
    const table = await employeeTwin.employeeTwin.sync();
    const result2 = await table.findAll({
    //   where: {
    //     employeeTwinID: req.query.empTwinId
    // }

    });
    const results = result2;
    const dataValues = results.map((result) => result.dataValues);
    const transactions = dataValues.map((obj) => obj.transactions);
    const reporting = dataValues.map((obj) => obj.reporting);
    const cognitive = dataValues.map((obj) => obj.cognitive);
    const decisionautomations = dataValues.map((obj) => obj.	decisionautomations);
    const softSkills = dataValues.map((obj) => obj.softSkill);
    const productId = dataValues.map((obj) => obj.product_id);
    const genAI = dataValues.map((obj) => obj.genAi);

 
    const originalListtransactions = transactions;
    const newList = [];

    for (let i = 0; i < originalListtransactions.length; i++) {
      const nestedList = originalListtransactions[i]?originalListtransactions[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newList.push(nestedList[j]);
      }
    }

    const originalListreporting = reporting;
    const newListGlo = [];
    for (let i = 0; i < originalListreporting.length; i++) {
      const nestedList = originalListreporting[i]?originalListreporting[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListGlo.push(nestedList[j]);
      }
    }
    const originalListcognitive = cognitive;
    const newListCog = [];
    for (let i = 0; i < originalListcognitive.length; i++) {
      const nestedList = originalListcognitive[i]?originalListcognitive[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListCog.push(nestedList[j]);
      }
    }
    const originalListdecisionautomations = decisionautomations;
    const newListDec = [];
    for (let i = 0; i < originalListdecisionautomations.length; i++) {
      const nestedList = originalListdecisionautomations[i]?originalListdecisionautomations[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListDec.push(nestedList[j]);
      }
    }

    const originalListSoft = softSkills;
    const newListSoft = [];
    for (let i = 0; i < originalListSoft.length; i++) {
      const nestedList = originalListSoft[i]?originalListSoft[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListSoft.push(nestedList[j]);
      }
    }
    const originalListGenAI = genAI
    const newListGenAIBot = [];
    const newListGenAISoft = []
    for (let i = 0; i < originalListGenAI.length; i++) {
      const nestedList = originalListGenAI[i]?originalListGenAI[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {

        let genAiValue = nestedList[j]

        if(genAiValue[0] == "S"){
          newListGenAISoft.push(genAiValue)
        }else{
          newListGenAIBot.push(genAiValue)
        }    
      }
    }

    const resultGenAISoft = await softSkill.findAll({
      where: {
        softSkillID: newListGenAISoft,
      },
    })
    const dataValuesGenAISoft = resultGenAISoft.map((result) => result.dataValues);
    const resultGenAISoftMap = dataValuesGenAISoft.map(
      ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
        botID:softSkillID,
        processName:skillName,
        processDescription:skillDescription,
        LeadPlatform:"",
        category:"Gen AI",
        type:"Gen AI Skill",
        Twin:"",
        Tech:"Gen AI",
        empTwinId:"",
        price:price,
        costType:costType
      })
    );

    const resultGenAIBot = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListGenAIBot,
      },
    });
    const dataValuesGenAIBot = resultGenAIBot.map((result) => result.dataValues);
    const resultGenAIBotMap = dataValuesGenAIBot.map(
      ({ botExternalId, processName,	processDescription,leadPlatform,botID}) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Gen AI",
        type:"Gen AI Skill",
        Twin:"",
        Tech:"Gen AI",
        empTwinId:"",
        price:6,
        costType:"Hour",
        id:botID
      })
    );

    
    const resultSoft = await softSkill.findAll({
      where: {
        softSkillID: newListSoft,
      },
    });
    const dataValuesSoft = resultSoft.map((result) => result.dataValues);
    const resultSoftMap = dataValuesSoft.map(
      ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
        botID:softSkillID,
        processName:skillName,
        processDescription:skillDescription,
        LeadPlatform:"",
        category:"Soft Skill",
        type:"softSkill",
        Twin:"",
        Tech:"Soft Skill",
        empTwinId:"",
        price:price,
        costType:costType
      })
    );
    const resultTransaction = await BotUser.Bot.findAll({
      where: {
        botExternalId: newList,
      },
    });
    const dataValuesTransactions = resultTransaction.map((result) => result.dataValues);
    const resultTranMap = dataValuesTransactions.map(
      ({ botExternalId, processName,	processDescription,leadPlatform,botID}) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Transaction",
        type:"transactionalSkill",
        Twin:"",
        Tech:"Transactional",
        empTwinId:"",
        price:6,
        costType:"Hour",
        id:botID
      })
    );

    const resultReporting = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListGlo,
      },
    });

    const dataValuesReporting = resultReporting.map((result) => result.dataValues);
    const resultReportMap = dataValuesReporting.map(
      ({ botExternalId, processName, processDescription,leadPlatform,botID }) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Reporting",
        type:"reportingSkills",
        Twin:"",
        Tech:"Reporting",
        empTwinId:"",
        price:6,
        costType:"Hour",
        id:botID
      })
    );
    const resultCognitive = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListCog,
      },
    });
    const dataValuesCognitive = resultCognitive.map((result) => result.dataValues);
    const resultCogMap = dataValuesCognitive.map(
      ({ botExternalId, processName,	processDescription,leadPlatform,botID }) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Cognitive",
        type:"cognitiveSkills",
        Twin:"",
        Tech:"Cognitive",
        empTwinId:"",
        price:6,
        costType:"Hour",
        id:botID
      })
    );
    const resultDecision = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListDec,
      },
    });
    const dataValuesDecision = resultDecision.map((result) => result.dataValues);
    const resultDecMap = dataValuesDecision.map(
      ({ botExternalId, processName,processDescription,leadPlatform,botID}) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Decision Automation",
        type:"decisionAutomationSkills",
        Twin:"",
        Tech:"Decision",
        empTwinId:"",
        price:6,
        costType:"Hour",
        id:botID
      })
    );
    const dt=resultTranMap;

    // Calculate the average rating for each soft skill
    
    const table1 = await skillRatings.sync();
  const averageRatings = {};
  const countRatings = {};

  const averageRatingsT = {};
  const countRatingsT = {};

  const averageRatingsR = {};
  const countRatingsR = {};

  const averageRatingsC = {};
  const countRatingsC = {};

  const averageRatingsD = {};
  const countRatingsD = {};

  const averageRatingGB = {};
  const countRatingGB = {};

  const averageRatingGS = {};
  const countRatingGS = {};


  for (const softSkillID of newListGenAIBot) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });
    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatingGB[softSkillID] = average; 
        countRatingGB[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingGB[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingGB[softSkillID] = 0;   // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingGB[softSkillID] = 0; // Default to 0 if no ratings
      countRatingGB[softSkillID] = 0;   // Default to 0 if no ratings
    }
  }

  for (const softSkillID of newListGenAISoft) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatingGS[softSkillID] = average;
        countRatingGS[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingGS[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingGS[softSkillID] = 0;   // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingGS[softSkillID] = 0; // Default to 0 if no ratings
      countRatingGS[softSkillID] = 0;   // Default to 0 if no ratings
    }
  }


  for (const softSkillID of newListSoft) {
    const ratings = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const average = totalRating / ratings.length;
    
      if (!isNaN(average)) {
        averageRatings[softSkillID] = average;
        countRatings[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatings[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatings[softSkillID] = 0;         // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatings[softSkillID] = 0; // Default to 0 if no ratings
      countRatings[softSkillID] = 0;       // Default to 0 if no ratings
    }
  }

  for (const softSkillID of newList) {
    const ratingsT = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsT.length > 0) {
      const totalRatingT = ratingsT.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageT = totalRatingT / ratingsT.length;
    
      if (!isNaN(averageT)) {
        averageRatingsT[softSkillID] = averageT;
        countRatingsT[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsT[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingsT[softSkillID] = 0;         // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsT[softSkillID] = 0; // Default to 0 if no ratings
      countRatingsT[softSkillID] = 0;       // Default to 0 if no ratings
    }
  }
  for (const softSkillID of newListGlo) {
    const ratingsR = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });
    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsR.length > 0) {
      const totalRatingR = ratingsR.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageR = totalRatingR / ratingsR.length;
    
      if (!isNaN(averageR)) {
        averageRatingsR[softSkillID] = averageR;
        countRatingsR[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsR[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingsR[softSkillID] = 0;         // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsR[softSkillID] = 0; // Default to 0 if no ratings
      countRatingsR[softSkillID] = 0;
    }
  }
  for (const softSkillID of newListCog) {
    const ratingsC = await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsC.length > 0) {
      const totalRatingC = ratingsC.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageC = totalRatingC / ratingsC.length;
    
      if (!isNaN(averageC)) {
        averageRatingsC[softSkillID] = averageC;
        countRatingsC[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsC[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingsC[softSkillID] = 0;         // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsC[softSkillID] = 0; // Default to 0 if no ratings
      countRatingsC[softSkillID] = 0;
    }
  }
  for (const softSkillID of newListDec) {
    const ratingsD= await skillRatings.findAll({
      where: {
        softSkillID: softSkillID,
      },
    });

    const ratingsCount = await skillRatings.count({
      where: {
        softSkillID: softSkillID,
      },
    });

    if (ratingsD.length > 0) {
      const totalRatingD = ratingsD.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      const averageD = totalRatingD / ratingsD.length;
    
      if (!isNaN(averageD)) {
        averageRatingsD[softSkillID] = averageD;
        countRatingsD[softSkillID] = ratingsCount;
      } else {
        // Handle the case where the average is NaN (e.g., no valid ratings)
        averageRatingsD[softSkillID] = 0; // Default to 0 if no valid ratings
        countRatingsD[softSkillID] = 0;         // Default to 0 if no valid ratings
      }
    } else {
      // Handle the case where there are no ratings at all
      averageRatingsD[softSkillID] = 0; // Default to 0 if no ratings
      countRatingsD[softSkillID] = 0;
    }
  }

  // Add the average rating to the soft skills in the response
  
  const resultGenAIBotMapWithRatings = resultGenAIBotMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingGB[softSkill.botID], // Add average rating
    countRatings: countRatingGB[softSkill.botID]
  }));

  const resultGenAISoftMapWithRatings = resultGenAISoftMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingGS[softSkill.botID], // Add average rating
    countRatings: countRatingGS[softSkill.botID]
  }));

  const resultSoftMapWithRatings = resultSoftMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatings[softSkill.botID], // Add average rating
    countRatings: countRatings[softSkill.botID]
  }));
  const resultTransMapWithRatings = resultTranMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsT[softSkill.botID], // Add average rating
    countRatings: countRatingsT[softSkill.botID]
  }));
  const resultRepMapWithRatings = resultReportMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsR[softSkill.botID], // Add average rating
    countRatings: countRatingsR[softSkill.botID]
  }));
  const resultCogMapWithRatings = resultCogMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsC[softSkill.botID], // Add average rating
    countRatings: countRatingsC[softSkill.botID]
  }));
  const resultDecMapWithRatings = resultDecMap.map((softSkill) => ({
    ...softSkill,
    averageRating: averageRatingsD[softSkill.botID], // Add average rating
    countRatings: countRatingsD[softSkill.botID]
  }));
  console.log("resultTransMapWithRatings",resultTransMapWithRatings)
  resultGenAIBotMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultGenAISoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultSoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultTransMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultRepMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultCogMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
  resultDecMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    const data = [
        ...resultTransMapWithRatings,
        ...resultRepMapWithRatings,
        ...resultCogMapWithRatings,
        ...resultDecMapWithRatings,
        ...resultSoftMapWithRatings,
        ...resultGenAISoftMapWithRatings,
        ...resultGenAIBotMapWithRatings
      ];
    

    res.status(200).json({
      data:data,
      code: 200,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
    console.log('line 634', error);
  }
}); 





//new code for getperskillNew

const getPerSkillNew = catchAsync(async(req,res,next)=>{
  const { ETID } = req.body
  console.log("ETID  line1609",ETID);
  try {
      const table = await deleteCostUseret.sync();
      
      const result = await table.findAll({
          where: {
              ETID: ETID,
            }
      });
      const dataVal = result.map(({ botID, Month }) => ({ botID, Month }));
      
        console.log("inside if part");
     
        const table1 = await Cost_per_Skill.sync();
        let result2;
        let test;
        if(dataVal.length<=0){
          test="length lessthan 0";
           result2 = await table1.findAll({
            where: {
              [Op.or]: [
                {
                  [Op.or]: [
                    { ETID: "0" },
                    { ETID: ETID },
                  ],
                },
                {
                  [Op.not]: {
                    [Op.and]: dataVal.map(({ botID, Month }) => ({
                      BotId: botID,
                      Month: Month,
                    })),
                  },
                },
              ],
            },
          });
        }
        else{
          test="length greator than 0";

          const allRecords = await table1.findAll({
            where: {
              [Op.or]: [
                {
                  ETID: "0",
                },
                {
                  ETID: ETID,
                },
              ],
            },}
          );

          // Filter out records that exist in deleteCostUseret
          result2 = allRecords.filter((record) => {
            return !dataVal.some(({botID}) => {
              return record.BotId === botID;
            });
          });
        }
        const dataValues = result2.map((result) => result.dataValues);
        const dataValuesn = dataValues.map((result) => result.BotId);
        
        const resultET = await employeeTwin.employeeTwin.findAll({
          where: {
            employeeTwinID: ETID,
          }
        });
        const dataValuesET = resultET.map((result) => result.dataValues);
        
        const filteredData = dataValues.filter(item => !dataVal.includes(item.BotId));
        
        console.log("filteredData",filteredData)


        const newfilteredData = filteredData.filter(item => {
          
          return dataValuesET.some(result =>
            columnHasValue(result.softSkill, item.BotId) ||
            columnHasValue(result.cognitive, item.BotId) ||
            columnHasValue(result.reporting, item.BotId) ||
            columnHasValue(result.transactions, item.BotId) ||
            columnHasValue(result.decisionautomations, item.BotId) ||
            columnHasValue(result.genAi, item.BotId) 
          );
        });
        function columnHasValue(columnValue, targetValue) {
          if (typeof columnValue === 'string') {
            const valuesArray = columnValue.split(',');
            return valuesArray.indexOf(targetValue) !== -1;
          }
          return false;
        }
        console.log("new",newfilteredData)

        const updatedFilteredData = newfilteredData.map(item => {
          console.log("botIDD",item);
          let techValue = "";
          if (dataValuesET.some(result => result.softSkill.includes(item.BotId))) {
            techValue = "Soft";
          }
          else if (dataValuesET.some(result => result.cognitive.includes(item.BotId))) {
            techValue = "Cognitive";
          } else if (dataValuesET.some(result => result.transactions.includes(item.BotId))) {
            techValue = "Transaction";
          } else if (dataValuesET.some(result => result.reporting.includes(item.BotId))) {
            techValue = "Reporting";
          } else if (dataValuesET.some(result => result.decisionautomations.includes(item.BotId))) {
            techValue = "Decision";
          } else if (dataValuesET.some(result => result.genAi.includes(item.BotId))) {
            techValue = "Gen AI";
          }
          const runCost = item.RunCost; 
          const noOfHits = item.NoOfHits; 
          const costPerHit = runCost / noOfHits;  
          return {
            ...item,
            CostPerHit: costPerHit.toFixed(2),
            Tech: techValue
          
          };
        });
        
        console.log("line filteredDataWithExtraField", updatedFilteredData);
        res.json({
          data: updatedFilteredData,
          test:test
        });
        
      
  } catch (error) {
    console.log(error);
      res.json({
          error: error,
      })
  }
})





const getETbyLeadPlatform = catchAsync(async (req, res, next) => {
    try {
      const table = await employeeTwin.employeeTwin.sync();
      let { leadPlatform } = req.body;
      const result2 = await table.findAll({
        where: {
          leadPlatform: leadPlatform,
        },
        order: [['createdAt', 'DESC']],
        limit: 1,
      });
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const transactions = dataValues.map((obj) => obj.transactions);
      const reporting = dataValues.map((obj) => obj.reporting);
      const cognitive = dataValues.map((obj) => obj.cognitive);
      const decisionautomations = dataValues.map((obj) => obj.	decisionautomations);
      const softSkills = dataValues.map((obj) => obj.softSkill);
      const productId = dataValues.map((obj) => obj.product_id);
      const etName = dataValues.map((obj) => obj.employeeTwinName);
      const etid = dataValues.map((obj) => obj.employeeTwinID);
      const etphoto = dataValues.map((obj) => obj.uploadPhoto);
  
   
      const originalListtransactions = transactions;
      const newList = [];
  
      for (let i = 0; i < originalListtransactions.length; i++) {
        const nestedList = originalListtransactions[i]?originalListtransactions[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
  
      const originalListreporting = reporting;
      const newListGlo = [];
      for (let i = 0; i < originalListreporting.length; i++) {
        const nestedList = originalListreporting[i]?originalListreporting[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListGlo.push(nestedList[j]);
        }
      }
      const originalListcognitive = cognitive;
      const newListCog = [];
      for (let i = 0; i < originalListcognitive.length; i++) {
        const nestedList = originalListcognitive[i]?originalListcognitive[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListCog.push(nestedList[j]);
        }
      }
      const originalListdecisionautomations = decisionautomations;
      const newListDec = [];
      for (let i = 0; i < originalListdecisionautomations.length; i++) {
        const nestedList = originalListdecisionautomations[i]?originalListdecisionautomations[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListDec.push(nestedList[j]);
        }
      }
  
 
      const originalListSoft = softSkills;
      const newListSoft = [];
      for (let i = 0; i < originalListSoft.length; i++) {
        const nestedList = originalListSoft[i]?originalListSoft[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListSoft.push(nestedList[j]);
        }
      }
      
  
      const resultSoft = await softSkill.findAll({
        where: {
          softSkillID: newListSoft,
        },
        limit: 5, 
        
      });
      const dataValuesSoft = resultSoft.map((result) => result.dataValues);
      const resultSoftMap = dataValuesSoft.map(
        ({ softSkillID, skillName, skillDescription,category }) => ({
          botID:softSkillID,
          processName:skillName,
      
          
        })
      );
      const resultTransaction = await BotUser.Bot.findAll({
        where: {
          botExternalId: newList,
        },
      });
      const dataValuesTransactions = resultTransaction.map((result) => result.dataValues);
      const resultTranMap = dataValuesTransactions.map(
        ({ botExternalId, processName,	processDescription,botID }) => ({
          botID:botExternalId,
          processName:processName,
          id:botID
        })
      );
  
      const resultReporting = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListGlo,
        },
      });
  
      const dataValuesReporting = resultReporting.map((result) => result.dataValues);
      const resultReportMap = dataValuesReporting.map(
        ({ botExternalId, processName, processDescription,botID }) => ({
          botID:botExternalId,
          processName:processName,
          id:botID
        })
      );
      const resultCognitive = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListCog,
        },
      });
      const dataValuesCognitive = resultCognitive.map((result) => result.dataValues);
      const resultCogMap = dataValuesCognitive.map(
        ({ botExternalId, processName,	processDescription,botID }) => ({
          botID:botExternalId,
          processName:processName,
          id:botID
        })
      );
      const resultDecision = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListDec,
        },
      });
      const dataValuesDecision = resultDecision.map((result) => result.dataValues);
      const resultDecMap = dataValuesDecision.map(
        ({ botExternalId, processName,processDescription,botID}) => ({
          botID:botExternalId,
          processName:processName,
          id:botID
        })
      );
      const dt=resultTranMap;
      const data = [
          ...resultTranMap,
          ...resultReportMap,
          ...resultCogMap,
          ...resultDecMap,
        ];
      

      res.status(200).json({
        data:data,
        etname:etName,
        etid:etid,
        etphoto:etphoto,
        softSkill:resultSoftMap,
        code: 200,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
      console.log('line 634', error);
    }
  });




const reverseaddedApi = catchAsync(async(req,res,next)=>{
    let { botID,ETID } = req.body;
    try {
       
   const deleteCostUser = await deleteCostUseret.sync();
    const deletedRowCount = await deleteCostUser.destroy({
                /*where: {
                  botID: botID,
                  ETID:ETID
                },*/
                where: {
                  [Op.and]: [
                      {  botID: botID},
                      {  ETID:ETID},
                     
                    ]
              }
              });
            
              if (deletedRowCount === 1) {
                // Row was successfully deleted
                res.status(204).json(); // Return a 204 No Content response
              } else {
                // Row with the specified botID was not found
                res.status(404).json({ message: 'Row not found' });
              }
            } catch (error) {
              console.error('Error deleting row:', error);
              res.status(500).json({ message: 'Internal Server Error' });
            }
  });


const getTwinDataindividualET = catchAsync(async (req, res, next) => {
  try {
    const table = await employeeTwin.employeeTwin.sync();
    const result2 = await table.findAll({
      where: {
        employeeTwinID: req.query.empTwinId
    }

    });
    const results = result2;
    const dataValues = results.map((result) => result.dataValues);
    const transactions = dataValues.map((obj) => obj.transactions);
    const reporting = dataValues.map((obj) => obj.reporting);
    const cognitive = dataValues.map((obj) => obj.cognitive);
    const decisionautomations = dataValues.map((obj) => obj.    decisionautomations);
    const softSkills = dataValues.map((obj) => obj.softSkill);
    const productId = dataValues.map((obj) => obj.product_id);
    
    const originalListtransactions = transactions;
    const newList = [];

    for (let i = 0; i < originalListtransactions.length; i++) {
      const nestedList = originalListtransactions[i]?originalListtransactions[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newList.push(nestedList[j]);
      }
    }

    const originalListreporting = reporting;
    const newListGlo = [];
    for (let i = 0; i < originalListreporting.length; i++) {
      const nestedList = originalListreporting[i]?originalListreporting[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListGlo.push(nestedList[j]);
      }
    }
    const originalListcognitive = cognitive;
    const newListCog = [];

 for (let i = 0; i < originalListcognitive.length; i++) {
      const nestedList = originalListcognitive[i]?originalListcognitive[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListCog.push(nestedList[j]);
      }
    }
    const originalListdecisionautomations = decisionautomations;
    const newListDec = [];
    for (let i = 0; i < originalListdecisionautomations.length; i++) {
      const nestedList = originalListdecisionautomations[i]?originalListdecisionautomations[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListDec.push(nestedList[j]);
      }
    }


    const originalListSoft = softSkills;
    const newListSoft = [];
for (let i = 0; i < originalListSoft.length; i++) {
      const nestedList = originalListSoft[i]?originalListSoft[i].split(','):[];
      for (let j = 0; j < nestedList.length; j++) {
        newListSoft.push(nestedList[j]);
      }
    }


    const resultSoft = await softSkill.findAll({
      where: {
        softSkillID: newListSoft,
      },
    });
    const dataValuesSoft = resultSoft.map((result) => result.dataValues);
 const resultSoftMap = dataValuesSoft.map(
      ({ softSkillID, skillName, skillDescription,category,price,costType }) => ({
      botID: softSkillID,
      processName: skillName,
      processDescription: skillDescription,
      LeadPlatform: "",
      category: "Soft Skill",
      type: "softSkill",
      Twin: "",
      Tech: "Soft Skill",
      empTwinId: req.query.empTwinId,
      price: price,
      costType:costType,
      })
    );
    const resultTransaction = await BotUser.Bot.findAll({
      where: {
        botExternalId: newList,
      },
    });
    const dataValuesTransactions = resultTransaction.map((result) => result.dataValues);
 const resultTranMap = dataValuesTransactions.map(
      ({ botExternalId, processName,    processDescription,leadPlatform }) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Transaction",
        type:"transactionalSkill",
        Twin:"",
        Tech:"Transactional",
        empTwinId:req.query.empTwinId,
        price:6,
        costType:"Hour"
      })
    );

    const resultReporting = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListGlo,
      },
    });

    const dataValuesReporting = resultReporting.map((result) => result.dataValues);
 const resultReportMap = dataValuesReporting.map(
      ({ botExternalId, processName, processDescription,leadPlatform }) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Reporting",
        type:"reportingSkills",
        Twin:"",
        Tech:"Reporting",
        empTwinId:req.query.empTwinId,
        price:6,
        costType:"Hour"
      })
    );
    const resultCognitive = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListCog,
      },
    });
    const dataValuesCognitive = resultCognitive.map((result) => result.dataValues);
 const resultCogMap = dataValuesCognitive.map(
      ({ botExternalId, processName,    processDescription,leadPlatform }) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Cognitive",
        type:"cognitiveSkills",
        Twin:"",
        Tech:"Cognitive",
        empTwinId:req.query.empTwinId,
        price:6,
        costType:"Hour"
      })
    );
    const resultDecision = await BotUser.Bot.findAll({
      where: {
        botExternalId: newListDec,
      },
    });
    const dataValuesDecision = resultDecision.map((result) => result.dataValues);
 const resultDecMap = dataValuesDecision.map(
      ({ botExternalId, processName,processDescription,leadPlatform}) => ({
        botID:botExternalId,
        processName:processName,
        processDescription:processDescription,
        LeadPlatform:leadPlatform,
        category:"Decision Automation",
        type:"decisionAutomationSkills",
        Twin:"",
        Tech:"Decision",
        empTwinId:req.query.empTwinId,
        price:6,
        costType:"Hour"
      })
    );
    const dt=resultTranMap;

 const table1 = await skillRatings.sync();
    const averageRatings = {};
    const countRatings = {};
    
    const averageRatingsT = {};
    const countRatingsT = {};

    const averageRatingsR = {};
    const countRatingsR = {};

    const averageRatingsC = {};
    const countRatingsC = {};

    const averageRatingsD = {};
    const countRatingsD = {};

    for (const softSkillID of newListSoft) {
      const ratings = await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      const ratingsCount = await skillRatings.count({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratings.length > 0) {
        const totalRating = ratings.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const average = totalRating / ratings.length;

        if (!isNaN(average)) {
          averageRatings[softSkillID] = average;
          countRatings[softSkillID] = ratingsCount;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatings[softSkillID] = 0; // Default to 0 if no valid ratings
          countRatings[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatings[softSkillID] = 0; // Default to 0 if no ratings
        countRatings[softSkillID] = 0; // Default to 0 if no ratings
      }
    }

 for (const softSkillID of newList) {
      const ratingsT = await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      const ratingsCount = await skillRatings.count({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratingsT.length > 0) {
        const totalRatingT = ratingsT.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const averageT = totalRatingT / ratingsT.length;

        if (!isNaN(averageT)) {
          averageRatingsT[softSkillID] = averageT;
          countRatingsT[softSkillID] = ratingsCount;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatingsT[softSkillID] = 0; // Default to 0 if no valid ratings
          countRatingsT[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatingsT[softSkillID] = 0; // Default to 0 if no ratings
        countRatingsT[softSkillID] = 0; // Default to 0 if no ratings
      }
    }
    for (const softSkillID of newListGlo) {
      const ratingsR = await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      const ratingsCount = await skillRatings.count({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratingsR.length > 0) {
        const totalRatingR = ratingsR.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const averageR = totalRatingR / ratingsR.length;

        if (!isNaN(averageR)) {
          averageRatingsR[softSkillID] = averageR;
          countRatingsR[softSkillID] = ratingsCount;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatingsR[softSkillID] = 0; // Default to 0 if no valid ratings
          countRatingsR[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatingsR[softSkillID] = 0; // Default to 0 if no ratings
        countRatingsR[softSkillID] = 0; // Default to 0 if no ratings
      }
    }
 for (const softSkillID of newListCog) {
      const ratingsC = await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      const ratingsCount = await skillRatings.count({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratingsC.length > 0) {
        const totalRatingC = ratingsC.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const averageC = totalRatingC / ratingsC.length;

        if (!isNaN(averageC)) {
          averageRatingsC[softSkillID] = averageC;
          countRatingsC[softSkillID] = ratingsCount;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatingsC[softSkillID] = 0; // Default to 0 if no valid ratings
          countRatingsC[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatingsC[softSkillID] = 0; // Default to 0 if no ratings
        countRatingsC[softSkillID] = 0; // Default to 0 if no ratings
      }
    }
 for (const softSkillID of newListDec) {
      const ratingsD= await skillRatings.findAll({
        where: {
          softSkillID: softSkillID,
        },
      });

      const ratingsCount = await skillRatings.count({
        where: {
          softSkillID: softSkillID,
        },
      });

      if (ratingsD.length > 0) {
        const totalRatingD = ratingsD.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
        const averageD = totalRatingD / ratingsD.length;

        if (!isNaN(averageD)) {
          averageRatingsD[softSkillID] = averageD;
          countRatingsD[softSkillID] = ratingsCount;
        } else {
          // Handle the case where the average is NaN (e.g., no valid ratings)
          averageRatingsD[softSkillID] = 0; // Default to 0 if no valid ratings
          countRatingsD[softSkillID] = 0; // Default to 0 if no valid ratings
        }
      } else {
        // Handle the case where there are no ratings at all
        averageRatingsD[softSkillID] = 0; // Default to 0 if no ratings
        countRatingsD[softSkillID] = 0; // Default to 0 if no ratings
      }
    }
 // Add the average rating to the soft skills in the response
    const resultSoftMapWithRatings = resultSoftMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatings[softSkill.botID].toFixed(1)), // Add average rating
      countRatings: countRatings[softSkill.botID], // Add number of ratings
    }));
    const resultTransMapWithRatings = resultTranMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatingsT[softSkill.botID].toFixed(1)), // Add average rating
      countRatings: countRatingsT[softSkill.botID], // Add number of ratings
    }));
    const resultRepMapWithRatings = resultReportMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatingsR[softSkill.botID].toFixed(1)), // Add average rating
      countRatings: countRatingsR[softSkill.botID], // Add number of ratings
    }));
    const resultCogMapWithRatings = resultCogMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatingsC[softSkill.botID].toFixed(1)), // Add average rating
      countRatings: countRatingsC[softSkill.botID], // Add number of ratings
    }));
    const resultDecMapWithRatings = resultDecMap.map((softSkill) => ({
      ...softSkill,
      averageRating: parseFloat(averageRatingsD[softSkill.botID].toFixed(1)), // Add average rating
      countRatings: countRatingsD[softSkill.botID], // Add number of ratings
 }));
    console.log("resultTransMapWithRatings",resultTransMapWithRatings)
    resultSoftMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    resultTransMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    resultRepMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    resultCogMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    resultDecMapWithRatings.sort((a, b) => b.averageRating - a.averageRating);

     const combinedData = [
          ...resultTransMapWithRatings,
          ...resultRepMapWithRatings,
          ...resultCogMapWithRatings,
          ...resultDecMapWithRatings,
          ...resultSoftMapWithRatings,
        ];
 // Sort the combinedData array in descending order based on averageRating
    combinedData.sort((a, b) => b.averageRating - a.averageRating);

    res.status(200).json({
      data:combinedData,
      code: 200,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
    console.log('line 634', error);
  }
});




/*Get soft skill, transaction,reporting,cognitive,decision automation in single api according to ET wise*/
  const rookieDataByET = catchAsync(async (req, res, next) => {
    try {
      const table = await employeeTwin.employeeTwin.sync();
      const result2 = await table.findAll({
      //   where: {
      //     employeeTwinID: req.query.empTwinId
      // }

      });
      const results = result2;
      const dataValues = results.map((result) => result.dataValues);
      const transactions = dataValues.map((obj) => obj.transactions);
      const reporting = dataValues.map((obj) => obj.reporting);
      const cognitive = dataValues.map((obj) => obj.cognitive);
      const decisionautomations = dataValues.map((obj) => obj.	decisionautomations);
      const softSkills = dataValues.map((obj) => obj.softSkill);
      const productId = dataValues.map((obj) => obj.product_id);

  
   
      const originalListtransactions = transactions;
      const newList = [];
  
      for (let i = 0; i < originalListtransactions.length; i++) {
        const nestedList = originalListtransactions[i]?originalListtransactions[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newList.push(nestedList[j]);
        }
      }
  
      const originalListreporting = reporting;
      const newListGlo = [];
      for (let i = 0; i < originalListreporting.length; i++) {
        const nestedList = originalListreporting[i]?originalListreporting[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListGlo.push(nestedList[j]);
        }
      }
      const originalListcognitive = cognitive;
      const newListCog = [];
      for (let i = 0; i < originalListcognitive.length; i++) {
        const nestedList = originalListcognitive[i]?originalListcognitive[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListCog.push(nestedList[j]);
        }
      }
      const originalListdecisionautomations = decisionautomations;
      const newListDec = [];
      for (let i = 0; i < originalListdecisionautomations.length; i++) {
        const nestedList = originalListdecisionautomations[i]?originalListdecisionautomations[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListDec.push(nestedList[j]);
        }
      }
  
 
      const originalListSoft = softSkills;
      const newListSoft = [];
      for (let i = 0; i < originalListSoft.length; i++) {
        const nestedList = originalListSoft[i]?originalListSoft[i].split(','):[];
        for (let j = 0; j < nestedList.length; j++) {
          newListSoft.push(nestedList[j]);
        }
      }
      
  
      const resultSoft = await softSkill.findAll({
        where: {
          softSkillID: newListSoft,
        },
      });
      const dataValuesSoft = resultSoft.map((result,index) => result.dataValues);
      const resultSoftMap = dataValuesSoft.map(
        ({ softSkillID, skillName, skillDescription,category },index) => ({
          botID:softSkillID,
          processName:skillName,
          processDescription:skillDescription,
          LeadPlatform:"",
          category:"Soft Skill",
          type:"softSkill",
          Twin:"",
          Tech:"Soft Skill",
          empTwinId:"",
          price: index < 10 ? 0 : 199, // First 10 skills have price: 0, the rest have price: 199
          free: index < 10, // First 10 skills are free, the rest are not free
      
          
        })
      );
      const resultTransaction = await BotUser.Bot.findAll({
        where: {
          botExternalId: newList,
        },
      });
      const dataValuesTransactions = resultTransaction.map((result) => result.dataValues);
      const resultTranMap = dataValuesTransactions.map(
        ({ botExternalId, processName,	processDescription,leadPlatform }) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Transaction",
          type:"transactionalSkill",
          Twin:"",
          Tech:"Transactional",
          empTwinId:"",
          price:199
        })
      );
  
      const resultReporting = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListGlo,
        },
      });
  
      const dataValuesReporting = resultReporting.map((result) => result.dataValues);
      const resultReportMap = dataValuesReporting.map(
        ({ botExternalId, processName, processDescription,leadPlatform }) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Reporting",
          type:"reportingSkills",
          Twin:"",
          Tech:"Reporting",
          empTwinId:"",
          price:199
        })
      );
      const resultCognitive = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListCog,
        },
      });
      const dataValuesCognitive = resultCognitive.map((result) => result.dataValues);
      const resultCogMap = dataValuesCognitive.map(
        ({ botExternalId, processName,	processDescription,leadPlatform }) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Cognitive",
          type:"cognitiveSkills",
          Twin:"",
          Tech:"Cognitive",
          empTwinId:"",
          price:199
        })
      );
      const resultDecision = await BotUser.Bot.findAll({
        where: {
          botExternalId: newListDec,
        },
      });
      const dataValuesDecision = resultDecision.map((result) => result.dataValues);
      const resultDecMap = dataValuesDecision.map(
        ({ botExternalId, processName,processDescription,leadPlatform}) => ({
          botID:botExternalId,
          processName:processName,
          processDescription:processDescription,
          LeadPlatform:leadPlatform,
          category:"Decision Automation",
          type:"decisionAutomationSkills",
          Twin:"",
          Tech:"Decision",
          empTwinId:"",
          price:499
        })
      );
      const dt=resultTranMap;
      const data = [
          ...resultTranMap,
          ...resultReportMap,
          ...resultCogMap,
          ...resultDecMap,
          ...resultSoftMap,
        ];
      

      res.status(200).json({
        data:data,
        code: 200,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
      console.log('line 634', error);
    }
  });

const CheckoutMailAPI = catchAsync(async (req, res, next) => {
  try {
    const { functionSkills, softSkills, totalSkills, totalPrice } = req.body;

    let mailerObject = {
      checkoutData: { functionSkills, softSkills, totalSkills, totalPrice },
      user: req.user,
      type: 'checkout mail',
    };
    await CheckoutMail(mailerObject);
    return res.status(200).json({ data: functionSkills });
  } catch (error) {
    res.status(400).send(error);
  }
}); 
//rating api
  const createdSkillRating = catchAsync(async (req, res) => {
    try {
      
      const { softSkillID, skill_ratings, review_title, review_description,email } = req.body;
  
      if (!softSkillID || skill_ratings < 1 || skill_ratings > 5) {
        return res.status(400).json({ success: false, error: 'Invalid input' });
      }
  
      const table = await skillRatings.sync(); 
      let existingSkillRating = await skillRatings.findOne({
        where: {
          softSkillID: softSkillID,
          email: email,
        },
      });
      if (existingSkillRating) {
        const newSkillRating = await skillRatings.update(
          req.body,
          { where: { softSkillID: softSkillID,email: email, } }
        );
        const message = 'Successfully updated';
        res.status(201).json({ success: true, data: newSkillRating,code: 200,msg:message });
      }
      else{
        const newSkillRating = skillRatings.build(req.body);
        const twinCreateResponse = await newSkillRating.save();
        const message = 'Successfully created';
        res.status(201).json({ success: true, data: newSkillRating,code: 200,msg:message });
      }
  
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });
  
  const getSkillRating = catchAsync(async (req, res, next) => {
    try {
      const { softSkillID, email } = req.body;
  
      if (!softSkillID) {
        return res.status(400).json({ success: false, error: 'Skill ID is required' });
      }
  
      const result = await skillRatings.findOne({
        where: {
          softSkillID: softSkillID,
          email:email
        },
      });
  
  
      res.status(200).json({ success: true, data: result,code:200 });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Server error',code:400 });
    }
  });
/////////skill API////////
const deleteSkillMailAPI = catchAsync(async(req,res) => {
  try {
    const { skillName, skilltype, email, RunCostPerHit_Hour,empid } = req.body;

    let mailerObject = {
      deleteskillData: { skillName, skilltype, email, RunCostPerHit_Hour,empid },
      user: req.user,
      type: 'Delete Skill mail',
    };
    await deleteSkillMail(mailerObject);
    return res.status(200).json({ data: skillName });
  } catch (error) {
    res.status(400).send(error);
  }
});

const addSkillMailAPI = catchAsync(async(req,res) => {
  try {
    const { skillName, skilltype, email, RunCostPerHit_Hour,empid } = req.body;

    let mailerObject = {
      addSkillData: { skillName, skilltype, email, RunCostPerHit_Hour,empid },
      user: req.user,
      type: 'Delete Skill mail',
    };
    await addSkillMail(mailerObject);
    return res.status(200).json({ data: skillName });
  } catch (error) {
    res.status(400).send(error);
  }
});


//trafic graph
 {/* const userTrafficGraph = catchAsync(async (req, res, next) => {
    const { ETID } = req.body;
    console.log(ETID);
  
    try {
      const employeeTwinData = await employeeTwin.employeeTwin.findAll({
        attributes: ['softSkill', 'transactions', 'reporting', 'cognitive', 'decisionautomations'],
        where: {
          employeeTwinID: ETID,
        },
      });
      // Extract unique concatenated values
    const uniqueConcatenatedValues = Array.from(new Set(
      [].concat(
        ...employeeTwinData.map((item) => [item.softSkill, item.transactions, item.reporting, item.cognitive, item.decisionautomations])
      )
    )).filter(value => value !== null && value !== undefined && value !== '');

    // Split the concatenated values into individual values
    const uniqueValues = uniqueConcatenatedValues
      .map(concatenatedValue => concatenatedValue.split(',').map(value => value.trim()))
      .flat();
  
      const table = await Cost_per_Skill.sync();
      
      const result = await table.findAll({
        attributes: [
          'Month',
          'Year',
          [sequelize.fn('SUM', sequelize.col('NoOfUsers')), 'NumberOfUsers'],
        ],
        where: {
          BotId: {
            [Op.in]: uniqueValues,
          },
        },
        group: ['Month','Year'], // You might also want to group by 'Year'
      });
  
      res.status(201).json({
        data: result,
        code: 200,
      });
    } catch (error) {
      console.log("Error:", error);
      res.json({
        error: error,
        code: 400,
      });
    }
  });*/}

const userTrafficGraph = catchAsync(async (req, res, next) => {
  const { ETID } = req.body;
  console.log(ETID);
  try {
    const employeeTwinData = await employeeTwin.employeeTwin.findAll({
      attributes: ['softSkill', 'transactions', 'reporting', 'cognitive', 'decisionautomations'],
      where: {
        employeeTwinID: ETID,
      },
    });
    // Extract unique concatenated values
  const uniqueConcatenatedValues = Array.from(new Set(
    [].concat(
      ...employeeTwinData.map((item) => [item.softSkill, item.transactions, item.reporting, item.cognitive, item.decisionautomations])
    )
  )).filter(value => value !== null && value !== undefined && value !== '');

  // Split the concatenated values into individual values
  const uniqueValues = uniqueConcatenatedValues
    .map(concatenatedValue => concatenatedValue.split(',').map(value => value.trim()))
    .flat();

    const table = await userPerBot.sync();
    
    const results = await table.findAll({
      attributes: [
        'Month',
        'Year',
        'NoOfUsers'
      ],
      where:{
        "ETID": ETID
      }
    });
    
    const finalData = results.map((result)=>{
      return{
        Month : result.get("Month"),
        Year : result.get("Year"),
        NumberOfUsers : result.get("NoOfUsers")
      }
    })


    res.status(201).json({
      data: finalData,
      code: 200,
    });
  } catch (error) {
    console.log("Error:", error);
    res.json({
      error: error,
      code: 400,
    });
  }
});

//19oct
  const getAllUsers = catchAsync(async (req, res) => {
    try {
      const searchText = req.query.text;
  
      console.log(searchText);
      const resultData = await newUserUnilever.findAll({
        where: {
          [sequelize.Op.or]: [
            {
              email: {
                [sequelize.Op.like]: `%${searchText}%`,
                
              },
            },
            {
            [sequelize.Op.and]: [
              {
                email: {
                  [sequelize.Op.like]: `%@unilever.com`,
                },
              },
              {
                name: {
                  [sequelize.Op.like]: `%${searchText}%`,
                },
              },
            ],
          },

          ],
        },
      });
      console.log('====================================');
      console.log('resultData', resultData);
      console.log('====================================');
  
      //const valData = resultData.map((result) => result.dataValues);
     // console.log('valData', valData);
     // const leadData = valData.map(({ email, name }) => ({ email, name }));
      //console.log('leaddata', leadData);
      // const filteredLeadData = leadData.filter(
      //   (user) => user.email !== 'mailto:anshu.rani@unilever.com'
      // );
        
       const valData = resultData.map((result) => result.dataValues);
      console.log('valData', valData);
      const filteredValData = valData.filter((user) => user.email.includes('@unilever.com'));
      const leadData = filteredValData.map(({ email, name }) => ({ email, name }));
      console.log('leaddata', leadData);
      res.status(200).json({
        user: leadData,
        status:200
      });
    } catch (err) {
      res.status(400).json({
        message: 'Not able to get users.',
      });
    }
  });
  const createET_user = catchAsync(async (req, res, next) => {
    try {
      await et_user.sync();
      const { ETid, name, email, usagedata, addedBy } = req.body;
  
      if (ETid && name && email && usagedata && addedBy) {
        // Create a new ET_user
        const newET_user = await et_user.create({
          ETid,
          name,
          email,
          usagedata,
          addedBy,
        });
  
        return res.status(201).json({
          status: 'success',
          data: {
            ET_user: newET_user,
          },
        });
      } else {
        return res.status(400).json({
          status: 'fail',
          message: 'Please provide all required fields',
        });
      }
    } catch (err) {
      return res.status(500).json({
        status: 'fail',
        message: err,
      });
    }
  });
  
  const getET_user = catchAsync(async (req, res, next) => {
    try {
      await et_user.sync();
  
      const { text } = req.body;
  
      if (!text) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please provide ETid or email',
        });
      }
  
      // Find the user
      const ET_user = await et_user.findAll({
        where: {
          [Op.or]: [
            {
              email: text,
            },
            {
              ETid: text,
            },
          ],
        },
      });
  
      if (!ET_user) {
        return res.status(400).json({
          status: 'fail',
          message: `ET_user does not exist`,
        });
      }
  
      return res.status(200).json({
        status: 'success',
        user: ET_user,
      });
    } catch (err) {
      console.error('Error in getET_user:', err);
  
      return res.status(500).json({
        status: 'fail',
        message: 'Internal Server Error',
      });
    }
  });
  const deleteET_user = catchAsync(async (req, res, next) => {
    try {
      await et_user.sync();
      const { ETid,email } = req.body;
  
      if (!ETid) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please provide ETid',
        });
      }
  
      const ET_user = await et_user.findOne({
        where: {
          [Op.and]: [
              {  ETid: ETid},
              {  email:email},
             
            ]
      }
      });
  
      console.log('ET User', ET_user);
  
      if (!ET_user) {
        return res.status(400).json({
          status: 'fail',
          message: `ET_user with ETid ${ETid} does not exist`,
        });
      }
  
      await ET_user.destroy({
        where: {
          [Op.and]: [
              {  ETid: ETid},
              {  email:email},
             
            ]
      }
    });
  
      return res.status(200).json({
        status: 'success',
        Deleted_user: ET_user,
      });
    } catch (err) {
      console.error('Error in deleteET_user:', err);
  
      return res.status(500).json({
        status: 'fail',
        message: 'Internal Server Error',
      });
    }
  });
 
  
  const getAllET_user = catchAsync(async (req, res, next) => {
    try {
      await et_user.sync();
  
      // Find the All user
      const ET_user = await et_user.findAll({});
  
      if (!ET_user) {
        return res.status(400).json({
          status: 'fail',
          message: `ET_users does not exist`,
        });
      }
  
      return res.status(200).json({
        status: 'success',
        user: ET_user,
      });
    } catch (err) {
      console.error('Error in getAllET_user:', err);
  
      return res.status(500).json({
        status: 'fail',
        message: 'Internal Server Error',
      });
    }
  });

  const createInvoiceTable = catchAsync(async (req, res, next) => {
  await InvoiceForm.sync();
  try {
    let manage = InvoiceForm.build(req.body);
    let response = await manage.save();
    console.log('response_Result', response);
    res.send(new ResponseObject(200, 'Data Inserted Successfully', true, response));
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: `Error In inserting data : ${error}` });
  }
});
const getCostCenterData = catchAsync(async (req, res, next) => {
  const { EmpID } = req.query; // Assuming you pass EmpID in the request body
  console.log('EmpID:', req.query);

  if (!EmpID) {
    return res.status(400).json({ error: 'EmpID is required in the request body' });
  }

  try {
    await InvoiceForm.sync(); // Sync the model with the database

    const data = await InvoiceForm.findAll({
      where: { EmpID }, // Filter based on EmpID
    });

    if (data.length === 0) {
      return res.status(403).json({ message: 'No data found for the provided EmpID', code: 403 });
    }

    res.status(200).json({ message: 'Data Found Successfully', data, code: 200 });
    console.log('Data Found Success', data);
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
const updateCostCenterData = catchAsync(async (req, res) => {
  console.log('updateCostCenterData', req);
  try {
    await InvoiceForm.sync();
    const {
      EmpID,
      businessApprover,
      costCenter,
      toCostCenter,
      glAccount,
      toCompanyCode,
      countryCode,
    } = req.body;

    const updatedData = await InvoiceForm.update(
      { businessApprover, costCenter, toCostCenter, glAccount, toCompanyCode, countryCode },
      { where: { EmpID } }
    );
    console.log('updatedData', updatedData);
    res.json({
      status: 201,
      updatedData: updatedData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating the data' });
  }
});

/*const emailCostCenterdata = catchAsync(async (req, res) => {
  try {
    await InvoiceForm.sync();
    const { EmpID, billingMonth } = req.body;
    const getMonth = billingMonth.split('-');
    console.log('getMonth', getMonth);

    const monthNumber = getMonth[1];
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthName = monthNames[parseInt(monthNumber, 10) - 1];

    console.log('monthName', monthName);

    req.user = 'mailto:aakib.ansari@unilever.com';

    console.log('req.user', req.user);

    const result = await InvoiceForm.findAll({
      where: {
        EmpID: EmpID,
      },
    });
    const dataValuesData = result.map((result) => result.dataValues);
    console.log('resultData', dataValuesData);
    let mailerObject = {
      emailData: dataValuesData,
      user: req.user,
      monthName: monthName,
      type: 'CostCenter',
    };
    console.log('mailerObject', mailerObject);
    await costControlMail(mailerObject);
    console.log('>>>>>>>>>>>>><<<<<<<', mailerObject.user);
    res.json(dataValuesData);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Error occurred while fetching the data' });
  }
});*/

const emailCostCenterdata =catchAsync(async(req,res)=>{
  try {
    await InvoiceForm.sync(); 
    const { EmpID,billingMonth } = req.body;
        const getMonth = billingMonth.split('-');
    console.log('getMonth',getMonth);
    
    const monthNumber = getMonth[1];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthName = monthNames[parseInt(monthNumber, 10) - 1];
    const selectedYear = getMonth[0];

    console.log('monthName',monthName);
    const result = await InvoiceForm.findAll({
        where: {
            EmpID: EmpID,
        },
    });
    const dataValuesData = result.map((result) => result.dataValues);
    console.log("resultData", dataValuesData); 

    //new code
    await Cost_per_Skill.sync();
    const resultData = await Cost_per_Skill.findAll({
      where: {
        ETID: EmpID,
        Month: monthName
      }
    });
    // console.log("resultData", resultData); 
    const dataValuesDataCPS = resultData.map((resultData) => resultData.dataValues);
    // console.log("resultData resultData", dataValuesData); 

    const runCostArray = dataValuesDataCPS.map(item => parseFloat(item.RunCost) || 0);
    const sumOfRunCost = runCostArray.reduce((acc, val) => acc + val, 0);
    
    console.log("Sum of RunCost:", sumOfRunCost);

    

    const totalBot = dataValuesData.map((dataValuesData) => dataValuesData.BotId);
    // console.log("resultData resultData", totalBot); 


const table = await employeeTwin.employeeTwin.sync();
    const resultBot = await table.findOne({
      where:{
        employeeTwinID:EmpID
      }
    })


    console.log("dataValuesET dataValuesET",resultBot.dataValues.reporting);
const reportingSkills=resultBot.dataValues.reporting
console.log("reportingSkills reportingSkills",resultBot.dataValues.reporting);
const resultReporting = await Cost_per_Skill.findAll({
  where: {
    BotId: reportingSkills,
    Month: monthName
  }
});
// console.log(" resultReporting  line 2543",resultReporting);

const reportingRunCost = resultReporting.map(item => item.dataValues.RunCost)
const reportingRunCostArray = reportingRunCost.length > 0 ? reportingRunCost : ['0'];
console.log("reportingRunCost 2546", reportingRunCostArray);
// console.log("reportingRunCost 2546",reportingRunCost);
const cognitiveSkills=resultBot.dataValues.cognitive
console.log("cognitiveSkills cognitiveSkills",resultBot.dataValues.cognitive);
const cognitiveSkillsReporting = await Cost_per_Skill.findAll({
  where: {
    BotId: cognitiveSkills,
    Month: monthName
  }
});
// console.log(" resultReporting  line 2543",cognitiveSkillsReporting);
const cogitiveRunCost = cognitiveSkillsReporting.map(item => item.dataValues.RunCost)
const cogitiveRunCostArray = cogitiveRunCost.length > 0 ? cogitiveRunCost : ['0'];
console.log("cogitiveRunCostArray 2546", cogitiveRunCostArray);
// console.log("cogitiveRunCost 2546",cogitiveRunCost);
const transactionsSkills=resultBot.dataValues.transactions 
console.log("transactionsSkillstransactionsSkills2553==>>",transactionsSkills);
console.log("transactionsSkills transactionsSkills",resultBot.dataValues.transactions);
const transactionSkillsReporting = await Cost_per_Skill.findAll({
  where: {
    BotId: transactionsSkills,
    Month: monthName
  }
});
// console.log(" resultReporting  line 2543",cognitiveSkillsReporting);
const transactionRunCost = transactionSkillsReporting.map(item => item.dataValues.RunCost) 
// console.log("transactionRunCost 2576",transactionRunCost);
const transactionRunCostArray = transactionRunCost.length > 0 ? transactionRunCost : ['0'];
console.log("transactionRunCostArray 2546", transactionRunCostArray);



const decisionautomationsSkills=resultBot.dataValues.decisionautomations 
console.log("decisionautomationsSkills==>>",decisionautomationsSkills);
console.log("decisionautomationsSkills decisionautomationsSkills",resultBot.dataValues.decisionautomations);
const decisionautomationsSkillsReporting = await Cost_per_Skill.findAll({
  where: {
    BotId: decisionautomationsSkills,
    Month: monthName
  }
});
// console.log(" resultReporting  line 2543",cognitiveSkillsReporting);
const decisionautomationsRunCost = decisionautomationsSkillsReporting.map(item => item.dataValues.RunCost) 
// console.log("transactionRunCost 2576",transactionRunCost);
const decisionautomationsRunCostArray = decisionautomationsRunCost.length > 0 ? decisionautomationsRunCost : ['0'];
console.log("decisionautomationsRunCostArray 2546", decisionautomationsRunCostArray);




const sumValues = (arr1, arr2,arr3,arr4) => {
  const convertedArr1 = arr1.map(parseFloat);
  const convertedArr2 = arr2.map(parseFloat);
  const convertedArr3 = arr3.map(parseFloat);
  const convertedArr4 = arr4.map(parseFloat);



  const sum = convertedArr1[0] + convertedArr2[0] + convertedArr3[0] + convertedArr3[0] + parseFloat(sumOfRunCost)
  return sum;
};

const resultSum = sumValues(reportingRunCostArray, cogitiveRunCostArray,transactionRunCostArray,decisionautomationsRunCostArray,sumOfRunCost);
console.log("resultresultresult 2584 cogitiveRunCost 11233344",resultSum);

    let mailerObject = {
      emailData:dataValuesData,
      user: req.user,
      type: 'CostCenter',
      totalRunCost:resultSum,
      monthName:monthName,
      selectedYear:selectedYear,
    };
    await costControlMail(mailerObject);
    console.log('>>>>>>>>>>>>><<<<<<<', mailerObject.user);
    res.json(dataValuesData); 
} catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: 'Error occurred while fetching the data' });
}

});

//pdf api-08112023 
const generatePDFAPI = catchAsync(async (req, res) => {
  try {

    const pdfDoc = req.body;

    let empTwin = await employeeTwin.employeeTwin.sync();

    let CostPerSkill = await Cost_per_Skill.sync();

      if(!pdfDoc.EmpID){
        return res.status(402).json({
          status: "Failed",
          message: "ETID is missing",
        })
      }
  
      const empTwins =  await empTwin.findOne({
        where: {
          employeeTwinID: pdfDoc.EmpID
        },
        attributes: [
          "employeeTwinName",
          "transactions",
          "reporting",
          "cognitive",
          "decisionautomations"
        ],
      })

      if(!empTwins && !pdfDoc.type){
        return res.status(402).json({
          status: "Failed",
          message: "No ET user exist with the provided ETID",
        })         
      }else if(!empTwins && pdfDoc.type == "Automated"){
        return
      }
  
      const transactionsArray = empTwins.dataValues.transactions ? empTwins.dataValues.transactions.split(',') : [];
      const reportingArray = empTwins.dataValues.reporting ? empTwins.dataValues.reporting.split(',') : [];
      const cognitiveArray = empTwins.dataValues.cognitive ? empTwins.dataValues.cognitive.split(',') : [];
      const decisionautomationsArray = empTwins.dataValues.decisionautomations ? empTwins.dataValues.decisionautomations.split(',') : [];
  
  
      const mergedArray = transactionsArray.concat(reportingArray, cognitiveArray,decisionautomationsArray);

      const months = ["NAN",
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
      ];

      let calculatedMonthIndex = 0
  
      if(pdfDoc.billingMonth){
          let twoDigitMonth = pdfDoc.billingMonth.slice(-2)
          if(twoDigitMonth[0] == "0"){
             let oneDigitMonth = twoDigitMonth.slice(1,2);
             calculatedMonthIndex = parseInt(oneDigitMonth);
          }
          else{
            calculatedMonthIndex = parseInt(twoDigitMonth);
          }
      }

      const currentMonth = pdfDoc.month ? pdfDoc.month : months[calculatedMonthIndex];

      const getCurrentYear = pdfDoc.dataOfYear ? pdfDoc.dataOfYear : pdfDoc.billingMonth.slice(0,4)

      const SkillDetails = await CostPerSkill.findAll({
        where: {
          BotId: mergedArray,
          Month: currentMonth,
          Year: getCurrentYear
        },
        attributes: [
          "RunCost",
          "SkillName",
          "BotId"
        ],
      })

      if(!SkillDetails && !pdfDoc.type){
        return res.status(402).json({
          status: "Failed",
          message: "No Skills for ET user",
        })
      }else if(!SkillDetails && pdfDoc.type == "Automated"){
        return
      }
  
  
      let totalRunCost = 0;
  
      SkillDetails.forEach((data) => {
        totalRunCost += parseFloat(data.dataValues.RunCost)
      })
  
      // Limit to two decimal places
      totalRunCost = totalRunCost.toFixed(2);
  
      let currentYear = new Date();
      let shortYear = currentYear.getFullYear(); 
      let twoDigitYear = shortYear.toString().substr(-2);
  
  
      // Create a PDF document
      const doc = new PDFDocument();
  
  
      // Pipe the PDF output to a file
      const filePath = path.resolve(__dirname, `../../../assets/pdf/RunCost_${currentMonth}_${twoDigitYear}_${empTwins.dataValues.employeeTwinName}.pdf`);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Add company logo
      const logoPath = path.resolve(__dirname, '../../../assets/images/HAP_logo.png')
      doc.image(logoPath, 500, 20, { width: 100 });
  
      const ETlogoPath = path.resolve(__dirname, '../../../assets/images/ET.png')
      doc.image(ETlogoPath, 8, 4, { width: 90 });
  
      // Set up table layout
      const tableTop = 120; // Adjust the top position of the table
      let horRows = 135;
      let column1 = 150; // Adjust the left position of the first column
      let column2 = 350; // Adjust the left position of the second column
      let textstart = 70;
      const rowHeight = 22; // Adjust the height of each row
  
      doc.text(`Below are the billing details for ${empTwins.dataValues.employeeTwinName} for the month of ${currentMonth} :`, textstart, tableTop-40);
  
      // Draw table headers with bold font
      doc.font('Helvetica-Bold').text('Requirement', column1 + 40, tableTop);
      doc.font('Helvetica-Bold').text('Comment', column2 , tableTop);
  
      
      // Draw horizontal lines
      doc.moveTo(column1, tableTop - 10 ).lineTo(column2 + 100, tableTop - 10).stroke();
      doc.moveTo(column1, tableTop + 15).lineTo(column2 + 100, tableTop + 15).stroke();
  
      for (let i = 1; i <= 9; i++) {
        doc.moveTo(column1, horRows + i * rowHeight).lineTo(column2 + 100, horRows + i * rowHeight).stroke();
      }
  
      // Draw vertical lines for table columns
      doc.moveTo(column1, tableTop - 10).lineTo(column1, tableTop + 213).stroke();
      doc.moveTo(column2 - 40, tableTop - 10).lineTo(column2 - 40, tableTop + 213).stroke();
      doc.moveTo(column2 + 100, tableTop - 10).lineTo(column2 + 100, tableTop + 213).stroke(); // Third vertical line
      
      // Draw table rows
      let yPos = tableTop + 22; // Start position for the first row
  
      let updatecolumn1 = column1 + 20;
  
      let updatecolumn2 = column2 - 20;
      
      // Set the font back to the default for the rest of the document
      doc.font('Helvetica');
  
      doc.text("ET Name", updatecolumn1, yPos);
      doc.text(empTwins.dataValues.employeeTwinName, updatecolumn2, yPos);
  
      doc.text("Month of billing", updatecolumn1, yPos + 22);
      doc.text(currentMonth, updatecolumn2, yPos + 22);
  
      doc.text("Business Approver", updatecolumn1, yPos + 45);
      doc.text(pdfDoc.businessApprover, updatecolumn2, yPos + 45);
  
      doc.text("Cost Center Owner", updatecolumn1, yPos + 66);
      doc.text(pdfDoc.costCenter, updatecolumn2, yPos + 66);
  
      doc.text("To Cost centre", updatecolumn1, yPos + 89);
      doc.text(pdfDoc.toCostCenter, updatecolumn2, yPos + 89);
  
      doc.text("GL Account", updatecolumn1, yPos + 111);
      doc.text(pdfDoc.glAccount, updatecolumn2, yPos + 111);
  
      doc.text("To Co. Code", updatecolumn1, yPos + 134);
      doc.text(pdfDoc.toCompanyCode, updatecolumn2, yPos + 134);
  
      doc.text("Country Code", updatecolumn1, yPos + 154);
      doc.text(pdfDoc.countryCode, updatecolumn2, yPos + 154);
  
      doc.text("Total Run-Cost", updatecolumn1, yPos + 176);
      doc.text(totalRunCost, updatecolumn2, yPos + 176);
  
  
      let secondTableHeight = 420;
  
      doc.text(`Below is the detailed summary of the cost :`, textstart, secondTableHeight - 40);
  
  
      let secondCol1 = 100;
      let secondCol2 = 270;
      let secondCol3 = 440;
  
      doc.moveTo(secondCol1-50, secondTableHeight - 10 ).lineTo(secondCol3 + 100, secondTableHeight - 10).stroke();
      doc.moveTo(secondCol1-50, secondTableHeight + 15).lineTo(secondCol3 + 100, secondTableHeight + 15).stroke();
      
      // Draw table headers with bold font
      doc.font('Helvetica-Bold').text('Skill Name', secondCol1 , secondTableHeight);
      doc.font('Helvetica-Bold').text('Skill Type', secondCol2 + 10 , secondTableHeight);
      doc.font('Helvetica-Bold').text('Run Cost', secondCol3 , secondTableHeight);
  
      let rowValue = 0
  
      doc.font('Helvetica');
  
      let secondTabelRow = secondTableHeight + 15;

      console.log("SkillDetailsSkillDetailsSkillDetails",SkillDetails)
  
      const finalValues = SkillDetails.map((i)=>{
  
        let botId = i.dataValues.BotId
       
        const isInTransactions = transactionsArray ? transactionsArray.includes(botId) : false;
        const isInReporting = reportingArray ? reportingArray.includes(botId) : false;
        const isInCognitive = cognitiveArray ? cognitiveArray.includes(botId) : false;
        const isInDecisionAutomations = decisionautomationsArray ? decisionautomationsArray.includes(botId) : false;
  
        return {
          skillName: i.dataValues.SkillName,
          skillType: isInTransactions ? 'Transactions' : isInReporting ? 'Reporting' : isInCognitive ? 'Cognitive' : isInDecisionAutomations ? 'Decision Automations' : 'Unknown',
          runCost: i.dataValues.RunCost
        };
      })
      
      for (let i = 1; i <= finalValues.length; i++) {
        doc.moveTo(secondCol1 - 50, secondTabelRow  + i * rowHeight).lineTo(secondCol3 + 100, secondTabelRow + i * rowHeight).stroke();
        rowValue += rowHeight
        doc.text(finalValues[i-1].skillName,secondCol1 - 45, secondTabelRow + i * rowHeight -15);
        doc.text(finalValues[i-1].skillType, secondCol2 - 30, secondTabelRow + i * rowHeight - 15);
        doc.text(finalValues[i-1].runCost, secondCol3 - 30, secondTabelRow + i * rowHeight -15);
      }
  
      // Draw vertical lines for table columns
      doc.moveTo(secondCol1 - 50, secondTableHeight - 10).lineTo(secondCol1 - 50, secondTableHeight + 15 + rowValue).stroke();
      doc.moveTo(secondCol2 - 40, secondTableHeight - 10).lineTo(secondCol2 - 40, secondTableHeight + 15 + rowValue).stroke();
      doc.moveTo(secondCol3 - 40 , secondTableHeight - 10).lineTo(secondCol3 - 40, secondTableHeight + 15 + rowValue).stroke();
      doc.moveTo(secondCol3 + 100, secondTableHeight - 10).lineTo(secondCol3 + 100, secondTableHeight + 15 + rowValue).stroke();
  
  
      // Finalize the PDF
      doc.end();
  
      // let fileName = `assets/pdf/RunCost_${pdfDoc.billingMonth}_${twoDigitYear}_${empTwins.dataValues.employeeTwinName}.pdf`;
  
      // const azureResponse = await azureConnection.uploadLocalFile('pdfFileStore', fileName);
  
      // console.log('Export All Azure response ---', azureResponse);
  
      // console.log("Pdf generated successfully!")

      console.log("pdfDocpdfDocpdfDocpdfDoc",pdfDoc)

      if(!pdfDoc.type){
        setTimeout(()=>{
  
          const pdfFileName = `RunCost_${currentMonth}_${twoDigitYear}_${empTwins.dataValues.employeeTwinName}.pdf`;
          const filePath = path.resolve(__dirname, `../../../assets/pdf/RunCost_${currentMonth}_${twoDigitYear}_${empTwins.dataValues.employeeTwinName}.pdf`);
      
          // Check if the file exists
          if (fs.existsSync(filePath)) {
            // Set the Content-Disposition header for download
            res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(pdfFileName)}`);
            res.setHeader('Content-Type', 'application/pdf');
      
            // Send the file as a response
            res.sendFile(filePath);
            
            console.log('File has been downloaded');
          } else {
            res.status(404).json({
              message: 'File not found',
              code: 404,
            });
          } 
         },1000) 
      }
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

// latest 15-11-2023

const getAllVirtualDeleteApi = catchAsync(async (req, res) => {
  const { ETID } = req.body;
  try {
    await deleteCostUseret.sync();
    const deletedUsers = await deleteCostUseret.findAll({ where: { ETID: ETID } });

    const valData = deletedUsers.map(({botID,ETID}) => ({botID,ETID}));
    //const deleUserData = valData
    //const firstID = etID[0];

    console.log("valData",valData);

    await Cost_per_Skill.sync();
    const users = await Cost_per_Skill.findAll({
      where: {
        [Op.or]: [
         
          {
            [Op.or]: valData.map(({ botID, ETID}) => ({
              BotId: botID,
              ETID:ETID
              
            })),
          },
          {
            [Op.or]: valData.map(({ botID }) => ({
              BotId: botID,
              
              ETID:"0"
            }))
          }
        ]
      },
    });
    console.log("users", users);
    const dataValues = users.map((result) => result.dataValues);
    //const dataValuesn = dataValues.map((result) => result.BotId);
    const resultET = await employeeTwin.employeeTwin.findAll({
      where: {
        employeeTwinID: ETID,
      },
    });
    const dataValuesET = resultET.map((result) => result.dataValues);

    const filteredData = dataValues.filter((valData) => valData);

    console.log('filteredData', filteredData);

    const newfilteredData = filteredData.filter((item) => {
      return dataValuesET.some(
        (result) =>
          columnHasValue(result.softSkill, item.BotId) ||
          columnHasValue(result.cognitive, item.BotId) ||
          columnHasValue(result.reporting, item.BotId) ||
          columnHasValue(result.transactions, item.BotId) ||
          columnHasValue(result.decisionautomations, item.BotId)||
          columnHasValue(result.genAi, item.BotId)
      );
    });
    function columnHasValue(columnValue, targetValue) {
      if (typeof columnValue === 'string') {
        const valuesArray = columnValue.split(',');
        return valuesArray.indexOf(targetValue) !== -1;
      }
      return false;
    }
    console.log('new', newfilteredData);

    const updatedFilteredData = newfilteredData.map((item) => {
      console.log('botIDD', item);
      let techValue = '';
      if (dataValuesET.some((result) => result.softSkill.includes(item.BotId))) {
        techValue = 'Soft';
      } else if (dataValuesET.some((result) => result.cognitive.includes(item.BotId))) {
        techValue = 'Cognitive';
      } else if (dataValuesET.some((result) => result.transactions.includes(item.BotId))) {
        techValue = 'Transaction';
      } else if (dataValuesET.some((result) => result.reporting.includes(item.BotId))) {
        techValue = 'Reporting';
      } else if (dataValuesET.some((result) => result.decisionautomations.includes(item.BotId))) {
        techValue = 'Decision';
      } else if (dataValuesET.some((result) => result.genAi.includes(item.BotId))) {
        techValue = 'Gen AI';
      }
      return {
        ...item,
        Tech: techValue,
      };
    });

    res.json({ data: updatedFilteredData });
  } catch (error) {
    console.log(error);
    res.json({
      data: 'data not found',
    });
  }
});


const getAllReviews = catchAsync(async (req, res, next) => {
  try {
    const { reviewID } = req.query;

    let result;
    let value = reviewID;

    if( value[0] == "S"){  
      result = await softSkill.findOne({
        where:{softSkillID: value},
        attributes: ['softSkillID', 'skillName']
      })
    }else{
      result = await BotUser.Bot.findOne({
        where: {
          botID: value,
        },      
       attributes: ['botID', 'processName']
      });
    }

    if (!result) {
      return res.status(404).json({ success: false, error: 'Review ID not found', code: 404 });
    }

    const reviews = await skillRatings.findAll({
      where: {
        softSkillID : reviewID,
      },
    });

    const ratingCount = await skillRatings.count({
      where: {
        softSkillID : reviewID,
      },
    });

    let averageRating = null;

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      averageRating = (totalRating / reviews.length).toFixed(2);;
    }


    const userReviewIndex = reviews.findIndex((review) => review.email === req.user.email);

    if (userReviewIndex !== -1) {
      const userReview = reviews.splice(userReviewIndex, 1)[0];
      reviews.unshift(userReview);
    }

    const reviewWithTime = reviews.map((review) => {
   // const updatedAt = review.dataValues.updatedAt;
      let email = review.dataValues.email;
    
      const createdAt = review.dataValues.createdAt;
      const createdDate = new Date(createdAt);
      
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      
      const createdTime = createdDate.toLocaleString('en-US', options);

     /*
      const currentTime = new Date();
      const timeDifference = currentTime - updatedAt;

      const minutesDifference = Math.floor(timeDifference / (1000 * 60));
     const hoursDifference = Math.floor(minutesDifference / 60);
    
      let formattedTimeDifference;
    
      if (hoursDifference < 24) {
        formattedTimeDifference = `${hoursDifference} hours`;
      } else {
        const daysDifference = Math.floor(hoursDifference / 24);
        formattedTimeDifference = `${daysDifference} days`;
      } */
      
      let fullName = null

      if(email){
        const username = email.split("@")[0];

        const capitalizedNames = username.split(".").map((name) => {
          return name.charAt(0).toUpperCase() + name.slice(1);
        });

        fullName = capitalizedNames.join(" ");
      }

      console.log("fullNamefullNamefullNamefullName",fullName);
    
      return {
        ...review.dataValues,
        timeDifference: createdTime,
        userName : fullName
      };
    });
    
    const response = {
      softSkillDetail: {
        reviewId: result.dataValues?.softSkillID || result.dataValues?.botID,
        skillName: result.dataValues?.skillName || result.dataValues?.processName,
        averageRating,
        ratingCount
      },
      allReviews: reviewWithTime,
    };

    res.status(200).json({ success: true, result: response, code: 200 });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error', code: 500 });
  }
});



/*
const getAllReviews = catchAsync(async (req, res, next) => {
  try {
    const { reviewID } = req.query;

    let result;
    let value = reviewID;

    if( value[0] == "S"){  
      result = await softSkill.findOne({
        where:{softSkillID: value},
        attributes: ['softSkillID', 'skillName']
      })
    }else{
      result = await BotUser.Bot.findOne({
        where: {
          botID: value,
        },      
       attributes: ['botID', 'processName']
      });
    }

    if (!result) {
      return res.status(404).json({ success: false, error: 'Review ID not found', code: 404 });
    }

    const reviews = await skillRatings.findAll({
      where: {
        softSkillID : reviewID,
      },
    });

    let averageRating = null;

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((acc, rating) => acc + parseFloat(rating.skill_ratings), 0);
      averageRating = totalRating / reviews.length;
    }

    const response = {
      softSkillDetail: {
        reviewId: result.dataValues?.softSkillID || result.dataValues?.botID,
        skillName: result.dataValues?.skillName || result.dataValues?.processName,
        averageRating
      },
      allReviews: reviews,
    };

    res.status(200).json({ success: true, data: response, code: 200 });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error', code: 500 });
  }
});*/


const toggleSkillsToMinicart = catchAsync(async (req, res, next) => {
  try {
    const { skillID } = req.query;

    // Ensure miniCart, softSkill, and BotUser tables are synchronized
    await Promise.all([miniCart.sync(), softSkill.sync(), BotUser.Bot.sync()]);

    if (!skillID) {
      return res.status(400).send({
        success: false,
        message: 'Please provide Skill ID or Bot ID',
      });
    }

    let BotIDorSkillID = '';
    let result = null;

    if (!isNaN(Number(skillID))) {
      BotIDorSkillID = Number(skillID);

      const existingCartItem = await miniCart.findOne({
        where: {
          userName: req.user.name,
          skillID: BotIDorSkillID,
        },
      });

      if (existingCartItem) {
        await miniCart.destroy({
          where: {
            userName: req.user.name,
            skillID: BotIDorSkillID,
          },
        });

        return res.status(200).json({
          success: true,
          message: 'Skill removed from the cart',
          code: 200,
        });
      } else {
        const botData = await BotUser.Bot.findOne({
          where: {
            botID: BotIDorSkillID,
          },
        });

        if (botData) {
          result = await miniCart.create({
            userName: req.user.name,
            skillID: BotIDorSkillID,
            skillName: botData.dataValues.processName,
            skillDescription: botData.dataValues.processDescription,
            price: botData.dataValues.price,
          });
        } else {
          return res.status(404).json({
            success: false,
            message: 'Bot ID not found',
            code: 404,
          });
        }
      }
    } else {
      BotIDorSkillID = skillID;

      const existingCartItem = await miniCart.findOne({
        where: {
          userName: req.user.name,
          skillID: BotIDorSkillID,
        },
      });

      if (existingCartItem) {
        await miniCart.destroy({
          where: {
            userName: req.user.name,
            skillID: BotIDorSkillID,
          },
        });

        return res.status(200).json({
          success: true,
          message: 'Skill removed from the cart',
          code: 200,
        });
      } else {
        const softSkillData = await softSkill.findOne({
          where: {
            softSkillID: BotIDorSkillID,
          },
        });

        if (softSkillData) {
          result = await miniCart.create({
            userName: req.user.name,
            skillID: BotIDorSkillID,
            skillName: softSkillData.dataValues.skillName,
            skillDescription: softSkillData.dataValues.skillDescription,
            price: softSkillData.dataValues.price,
          });
        } else {
          return res.status(404).json({
            success: false,
            message: 'Soft Skill ID not found',
            code: 404,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Skill added to the cart',
      result: result,
      code: 200,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error', code: 500 });
  }
});



const getselectedSkills = catchAsync(async (req, res, next) => {
  try {
    await miniCart.sync();

    const user = req.user.name;

    const result = await miniCart.findAll({
      where: {
        userName: user,
      },
    });

    if (result.length <= 0) {
      return res
        .status(404)
        .json({ success: false, message: 'User has not selected any items yet', code: 404 });
    }

    let totalPrice = 0;

    result.forEach((data) => {
      totalPrice += data.dataValues.price;
    });

    const response = {
      totalItemsInMiniCart: result.length,
      totalPriceOfMiniCart: totalPrice,
      selectedSkills: result,
    };

    res.status(200).json({ success: true, response, code: 200 });


    await miniCart.destroy({
      where: {
        userName: user,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error', code: 500 });
  }
});

const deleteSelectedSkill = catchAsync(async (req, res, next) => {
  try {
    await miniCart.sync();

    const { skillID } = req.query;
    const user = req.user.name;

    if (!skillID) {
      return res.status(400).send({
        success: false,
        message: 'Please provide Skill ID or Bot ID to delete',
      });
    }

    const deleteItem = await miniCart.destroy({
      where: {
        userName : user,
        skillId: skillID
    }
  }) 

   if(deleteItem === 0 ){
     return  res.status(404).json({ success: false, message: 'Provided skill Id is not yet selected', code: 404 });
   }

   return res.status(200).json({ success: true, message: 'Provided Skill Id is deleted.', code: 200 });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error', code: 500 });
  }
});

export default {
    createTwin,
    getTwin,
    feedBackApi,
    localGlobalSkillTwin,
    DltLocalGlobalSkillTwin,
    sumManulAndFte,
    searchTwin,
    softSkillSearch,
    documentLink, 
////
   randomMailData,

//
  updateCart,
    deleteCart,
localGlobalCartTwin,

//purchase
getAllTwinData,
    getLeadPlatform,
    getArea,
    getSubArea,
    updateCartNew,
    purchasecartTwin,
    deletepurchaseCart,
//order mail API
orderMailData,
searchSoftSkill,

    getAreaProduct,
    getSubAreaProduct,
    getProductEmployeetwin,
//latest api
    getallSkillsByET,
    searchTwin2,
    virtualDeleteApi,
    getTwinDataByET,
    getPerSkillNew,
    getETbyLeadPlatform,
    getAllVirtualDeleteApi,
    reverseaddedApi,
    getTwinDataindividualET,
    rookieDataByET,
CheckoutMailAPI,
    createdSkillRating,
    getSkillRating,
deleteSkillMailAPI,
  addSkillMailAPI,
  userTrafficGraph,
     getAllUsers,
    createET_user,
    getET_user,
    getAllET_user,
    deleteET_user,
    createInvoiceTable,
  getCostCenterData,
  updateCostCenterData,
  emailCostCenterdata,
  generatePDFAPI,
  getAllReviews ,
  toggleSkillsToMinicart,
  getselectedSkills,
  deleteSelectedSkill
}
