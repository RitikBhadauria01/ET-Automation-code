import catchAsync from '../helpers/catchAsync';
import GfcfValidations from '../helpers/validation';
import ResponseObject from '../helpers/responseObjectClass';
import multiparty from 'multiparty';
import excelToJson from 'convert-excel-to-json';
import Gfcf from '../models/ControlFramework';
import Excel from 'exceljs';
import config from '../../config/env';
import azureConnection from '../helpers/azureConnection';

// create gfcf through file
const createGfcf = catchAsync(async (req, res, next) => {
  console.log('resquest here ---');
  let form = new multiparty.Form();
  //let all = [];
  form.parse(req, async function (err, fields, files) {
    // console.log('inside form parse -----')
    //console.log(files, 'files', fields, 'fields');
    //console.log('path  ---' ,files.gfcfiles[0].path)
    const json = excelToJson({
      sourceFile: files.gfcfiles[0].path,
    });
    console.log('json sheet --', json['GFCF 2021'].length);
    //console.log('json sheet  111--', json.Sheet1);
    if (json['GFCF 2021']) {
      json['GFCF 2021'].map(async (obj, index) => {
        let tempObj = {};
        if (index > 0) {
          for (const [key, value] of Object.entries(json['GFCF 2021'][0])) {
            // console.log(`${key}: ${value}`);
            tempObj[json['GFCF 2021'][0][key]] = obj[key];
          }
          //console.log('tempObj============>', tempObj);
          //
          await Gfcf.sync();
          let gfcfResposne = Gfcf.build(tempObj);
          await gfcfResposne.save();
          console.log('gfcfResposne============>', gfcfResposne);
          if (index == json['GFCF 2021'] - 1) {
            res.send(new ResponseObject(200, 'Sucessfully Created ', true, gfcfResposne));
          }
        }
      });
    }
  });
});

const getGfcfData = catchAsync(async (req, res, next) => {
  console.log('req.quer', req.query);
  // set user role
  const query = req.query;
  const getResponse = await Gfcf.findAll({
    attributes: ['control', 'controlName', 'controlDescription'],
    where: query,
    order: [['control', 'ASC']],
  });
  console.log('get resposne  ---', getResponse);
  res.send(new ResponseObject(200, 'Entries found', true, getResponse));
});

const exportGfcfData = catchAsync(async (req, res, next) => {
  // fetch and send to the user
  const gfcfData = await Gfcf.findAll();
  console.log('length ---', gfcfData.length);
  // push to array
  let gfcfArray = [];
  gfcfData.forEach((item) => {
    gfcfArray.push(item.dataValues);
  });
  //
  //console.log("gfcf array  ---", gfcfArray);
  /* write to book 
      write headers
      write rest
      upload to azure 
      send url in response
  */

  let workbook = await new Excel.Workbook();
  let sheet1 = await workbook.addWorksheet('Gfcf Data');

  let headers = [];
  for (let i in gfcfArray[0]) {
    headers[i] = i;
  }
  console.log('headers', Object.values(headers));
  //return;
  sheet1.addRow().values = Object.values(headers);

  for (let i in gfcfArray) {
    sheet1.addRow().values = Object.values(gfcfArray[i]);
  }
  //return;
  //
  let date = new Date().toISOString();
  date = date.split('.')[0].replaceAll(':', '-');
  console.log('date', date);
  let fileName = `./ExcelFiles/Lead_Cluster_Email_Mapping${date}.xlsx`;
  console.log('FileName', fileName);
  await workbook.xlsx.writeFile(fileName);
  const azureResponse = await azureConnection.uploadLocalFile('botstorevideo', fileName);
  console.log('Export All Azure response ---', azureResponse);
  res.send(
    new ResponseObject(
      200,
      'Successfully Exported',
      true,
      `${config.fileUpload}/ExcelFiles/Lead_Cluster_Email_Mapping${date}.xlsx`
    )
  );
});

export default {
  createGfcf,
  getGfcfData,
  exportGfcfData,
};
