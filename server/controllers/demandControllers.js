import catchAsync from '../helpers/catchAsync';
import DemandValidations from '../helpers/validation';
import Demand from '../models/demands';
import ResponseObject from '../helpers/responseObjectClass';
import multiparty from 'multiparty';
import excelToJson from 'convert-excel-to-json';
import Excel from 'exceljs';
import azureConnection from '../helpers/azureConnection';
import config from '../../config/env';
import { Op } from 'sequelize';
//createDemand
const createDemand = catchAsync(async (req, res, next) => {
  console.log('req body ---', req.body);

  for (const prop in req.body) {
    let response = await DemandValidations(req.body[prop], prop);
    if (response != true) {
      next(response);
      return;
    }
  }
  await Demand.sync();
  let demandResposne = Demand.build(req.body);
  await demandResposne.save();
  res.send(new ResponseObject(200, 'Sucessfully Created', true, demandResposne));
});

// get excel file and create demand
const createDemandThroughFile = catchAsync(async (req, res, next) => {
  const mandatoryFields = [
    'subArea',
    'cluster',
    'product',
    'productOwner',
    'sessionDate',
    'targetPitch',
    'el',
  ];
  let form = new multiparty.Form();
  let all = [];
  form.parse(req, async function (err, fields, files) {
    const json = excelToJson({
      sourceFile: files.demandFile[0].path,
    });
     console.log('demand ', json);
     
   let newDemandHeaders =   {
      A: 'cluster',
      B: 'subArea',
      C: 'product',
      D: 'mcoLeadPlatform',
      E: 'targetPitch',
      F: 'sessionDate',
      G: 'el',
      H: 'currentStatus',
      I: 'convertedDemand',
      J: 'productOwner',
      K: 'commentsFromStakeHolder'
    }

    // console.log(json['Demand'] != undefined)
    if (json['Demand'] != undefined) {
      if (json['Demand'].length > 1) {
        //   console.log("here");
        console.log('length ---', json['Demand'].length);
        json['Demand'].map(async (obj, index) => {
          let tempObj = {};
          if (index > 0) {
            for (const [key, value] of Object.entries(newDemandHeaders)) {
              tempObj[newDemandHeaders[key]] = obj[key];
            }
            console.log('temp obj --inside json map  -----', tempObj);
            let demandResposne = '';
            let validation = true;
            // add check if row data is empty
           // console.log('keys ', Object.keys(tempObj).length);
            if (Object.keys(tempObj).length <= 12) {
              console.log("SESSION DATE IS----", tempObj)
          
              for (let i = 0; i < mandatoryFields.length; i++) {
                if (
                  tempObj[mandatoryFields[i]] !== '' &&
                  tempObj[mandatoryFields[i]] !== undefined
                ) {
                
                } else {
                  validation = false;
                  res.send(new ResponseObject(400, 'Mandatory field missing', false, {}));
                  console.log('here inside else');
                }
              }
              let thisDate = new Date(tempObj.sessionDate)
              thisDate.setDate(thisDate.getDate() + 1)
              
            
              if (isNaN(thisDate)) {
                console.log('wrong input ---');
                res.send(
                  new ResponseObject(400, 'Wrong Input Field session date', false, {})
                );
                return;
              }
              if (validation) {
                console.log(tempObj, "tempObjjjjjj")
                tempObj.sessionDate = thisDate
                demandResposne = Demand.build(tempObj);
                const demandTableResponse = await demandResposne.save();
                all.push(demandTableResponse);
              }
              if (index == json['Demand'].length - 1) {
                console.log('length reponse ---', all.length);
                if (all.length == 0) {
                  res.send(new ResponseObject(200, 'Empty File', false, {}));
                } else res.send(new ResponseObject(200, 'Sucessfully Created ', true, {}));
              }
            } else {
              res.send(new ResponseObject(400, 'Wrong File', false, {}));
            }
          }
        });
      } else {
        res.send(new ResponseObject(400, 'Empty File no data', false, {}));
      }
    } else {
      res.send(new ResponseObject(400, 'Invalid File', false, {}));
    }
  });
});
// schema mapper
//get demands
const getDemandData = catchAsync(async (req, res, next) => {
  let query = req.query;
  console.log('query  ---', query);
  //  user validation
  let offset = 0;
  if (Object.keys(query).includes('offset')) {
    offset = parseInt(query.offset);
    //console.log("andar", offset)
    delete query.offset;
  }
  let { search } = req.query;
  let searchFilter = {};
  if (search != undefined && search != '') {
    console.log('inside search');
    // genreate whre query
    searchFilter = {
      [Op.or]: [
        {
          subArea: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          cluster: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          convertedDemand: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          currentStatus: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          product: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          productOwner: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          mcoLeadPlatform: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          el: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          targetPitch: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    };
  }
  if (Object.keys(query).includes('search')) {
    delete query.search;
  }
  console.log('query ---', query);
  let response = await Demand.findAndCountAll({
    limit: 5,
    offset: offset,
    order: [['rowKey', 'desc']],
    where: {
      [Op.and]: [searchFilter, query],
    },
  });
  let getDemandMessage = 'Succesfully Found';
  if (response.length == 0) {
    getDemandMessage = 'No Such Demand';
  }
  res.send(new ResponseObject(200, getDemandMessage, true, response));
});

// update a demand
const updateDemandData = catchAsync(async (req, res, next) => {
  //user validations
  console.log('req user  ---', req.user);
  console.log('req body  ---', req.body);
  let demandRequest = req.body.demandUpdateFields;
  let sessionDate = new Date(demandRequest.sessionDate).getDate();
  console.log('session date --', sessionDate);
  if (req.body.emailAndSerialNumber.rowKey == '') {
    next(new AppError('Serial number  is missing', 404));
    return;
  }
  if (req.body.emailAndSerialNumber.UserEmail == '') {
    next(new AppError('User Email  id missing', 404));
    return;
  }
  for (const prop in req.body.demandUpdateFields) {
    let response = await DemandValidations(req.body.demandUpdateFields[prop], prop);
    if (response != true) {
      next(response);
      return;
    }
  }
  let responseFromUpdate = await Demand.update(demandRequest, {
    where: {
      rowKey: req.body.emailAndSerialNumber.rowKey,
    },
  });

  let updateMessage = 'Sucessfully Updated';
  if (responseFromUpdate[0] == 0) {
    updateMessage = 'No such Demand to update';
  }
  res.send(new ResponseObject(200, updateMessage, true, responseFromUpdate));
});

// delete a demand
const deleteDemandData = catchAsync(async (req, res, next) => {
  for (const prop in req.body) {
    let response = await DemandValidations(req.body[prop], prop);
    if (response != true) {
      next(response);
      return;
    }
  }
  let demandDeleteResponse = await Demand.destroy({
    where: {
      serialNumber: req.body.serialNumber,
    },
  });

  let demandDeleteMessage = 'Demand Sucessfully Deleted';
  if (demandDeleteResponse === 0) {
    demandDeleteMessage = 'No Such Demand Exist';
  }
  res.send(new ResponseObject(200, demandDeleteMessage, true, demandDeleteResponse));
});

const getAllDemand = catchAsync(async (req, res, next) => {});

const demandFilter = catchAsync(async (req, res, next) => {
  let query = req.query;
  console.log('query demand filter', req.query);
  let response = await Demand.findAll({
    where: req.query,
  });
  let getDemandMessage = 'Succesfully Found';
  if (response.length == 0) {
    getDemandMessage = 'No Such Demand';
  }

  res.send(new ResponseObject(200, getDemandMessage, true, response));
});
const getDemandFile = catchAsync(async (req, res, next) => {
  console.log('query demand filter', req.query);

  /**
   * ID
Cluster
Area
Comments from Stakeholders
Converted Demand
Director
EL
SPOC
Session Date
Session Led By
Target Pitch
Current Status
   */
  let response = await Demand.findAll({
    attributes: [
      ['rowKey', 'ID'],
      ['cluster', 'Cluster'],
      ['subArea', 'Sub Area'],
      ['commentsFromStakeHolder', 'Comments from Stakeholders'],
      ['convertedDemand', 'Converted Demand'],
      ['product', 'Product'],
      ['productOwner', 'Product Owner'],
      ['mcoLeadPlatform', 'MCO/Lead Platform'],
      ['sessionDate', 'Session Date'],
      ['el', 'Engagement Lead'],
      ['targetPitch', 'Target Pitch'],
      ['currentStatus', 'Current Status'],
    ],
    where: req.query,
  });
  // console.log("response export file", response);
  //
  let myAr = [];
  for (let i in response) {
    myAr.push(response[i].dataValues);
  }

  let workbook = await new Excel.Workbook();
  let sheet1 = await workbook.addWorksheet('Demand');
  let headers = {};
  for (let i in myAr[0]) {
    headers[i] = i;
  }
  console.log('headersssss-----', headers);
  sheet1.addRow().values = Object.values(headers);
  for (let i in myAr) {
    sheet1.addRow().values = Object.values(myAr[i]);
  }
  let date = new Date().toISOString();
  date = date.split('.')[0].replaceAll(':', '-');
  // console.log("date", date);
  let fileName = `./ExcelFiles/demandFile${date}.xlsx`;
  // console.log("fileName --", fileName);
  await workbook.xlsx.writeFile(fileName);

  const azureResponse = await azureConnection.uploadLocalFile('botstorevideo', fileName);
  // console.log('azure response --', azureResponse);
  res.send(
    new ResponseObject(
      200,
      'Sucessfully Created',
      true,
      `${config.fileUpload}/ExcelFiles/demandFile${date}.xlsx`
    )
  );
});

const getDemandSampleFile = catchAsync(async (req, res, next) => {
  // create the file using heade and uplod to blob and then download
  console.log('here sample file request');

  let headers = {
   // timestamp: 'timestamp',
   cluster: 'Cluster', 
   subArea: 'Sub area',
   product: 'Product',
   mcoLeadPlatform: 'MCO/Lead Platform',
   targetPitch: 'Target pitch',
   sessionDate: 'Session date',
   sessionLedBy: 'Session led by',
   currentStatus: 'Current status',
   convertedDemand: 'Converted demand',
   productOwner: 'Product owner',
  commentsFromStakeHolder: 'Comments from stakeholder',
    
  };
  

  //return;
  let workbook = await new Excel.Workbook();
  let sheet1 = await workbook.addWorksheet('Demand');
  sheet1.addRow().values = Object.values(headers);
  let fileName = `./ExcelFiles/demandFile.xlsx`;
  // console.log("fileName --", fileName);
  await workbook.xlsx.writeFile(fileName);
  const azureResponse = await azureConnection.uploadLocalFile('botstorevideo', fileName);
  console.log('azure response --', azureResponse);
  res.send(
    new ResponseObject(
      200,
      'Sucessfully Created',
      true,
      `${config.fileUpload}/ExcelFiles/demandFile.xlsx`
    )
  );
});

export default {
  createDemand,
  getDemandData,
  updateDemandData,
  deleteDemandData,
  getAllDemand,
  createDemandThroughFile,
  demandFilter,
  getDemandFile,
  createDemandThroughFile,
  getDemandSampleFile,
};
