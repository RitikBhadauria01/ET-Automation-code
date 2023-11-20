import catchAsync from '../helpers/catchAsync';
import ResponseObject from '../helpers/responseObjectClass';
import RoiForm from '../models/RoiFormOnlyData';
import ExcelJS from 'exceljs';

const createRoiFormData = catchAsync(async (req, res, next) => {
  await RoiForm.sync();
  try {
    let manage = RoiForm.build(req.body);
    let response = await manage.save();
    console.log('response_Result', response);
    res.send(new ResponseObject(200, 'Data Inserted Successfully', true, response));
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: `Error In inserting data : ${error}` });
  }
});

// const exportInExcel = catchAsync(async (req, res, next) => {
//   try {
//     const formData = req.body;
//     console.log('excelformData', formData);
//     const workbook = new ExcelJS.Workbook(); // Create a new Workbook instance

//     // Add a worksheet and set its properties
//     const worksheet = workbook.addWorksheet('FormData', {
//       properties: { tabColor: { argb: 'FFC0000' } },
//     });

//     // Iterate through the form data and add it to the worksheet
//     for (const key in formData) {
//       if (formData.hasOwnProperty(key)) {
//         worksheet.addRow([key, formData[key]]);
//       }
//     }

//     // Set the content type and headers for the response
//     res.setHeader(
//       'Content-Type',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );
//     res.setHeader('Content-Disposition', 'attachment; filename=FormData.xlsx');

//     // Serialize the workbook to the response
//     await workbook.xlsx.write(res);

//     res.end();
//   } catch (error) {
//     console.error('Error In Extracting Data In Excel:', error);
//     res.status(500).json({ error: `Error In Extracting Data: ${error}` });
//   }
// });

const exportInExcel = catchAsync(async (req, res, next) => {
  try {
    const formData = req.body;
    console.log('excelformData', formData);
    const workbook = new ExcelJS.Workbook(); // Create a new Workbook instance

    // Add a worksheet and set its properties
    const worksheet = workbook.addWorksheet('ROI Form All Data', {
      properties: { tabColor: { argb: '189ad3' } },
    });

    // Create an array for headers and values
    const headers = [ 'Cluster', 'MCO', 'Country', 'Lead Platform', 'Area', 'Sub Area', 'Opportunity Name', 'Opportunity Description​', 'Technology', 'Bot Id​', 'Mannual Hours', 'Executed Annually', 'Number of Resources', 'Error Rate(Percentage %)', 'Cost Avoidance(Euros)', 'OKRs', 'Development Cost(Euros)', 'Run Cost (Euros)', 'Resource ROI Months Breakdown', `Resource ROI For 1 Year`, `Resource ROI For 3 Year`, 'ROI Months Breakdown', `ROI For 1 Year`, `ROI For 3 Year`, 'Form Submitted By', ];
    const values = [];

    // Iterate through the form data and separate keys and values
    for (const key in formData) {
      if (formData.hasOwnProperty(key)) {
        // headers.push(key);
        values.push(formData[key]);
      }
    }

    // Add headers in the first row
    let customHeader = worksheet.addRow(headers);
    customHeader.font = { bold: true };
    // Add values in the second row
    worksheet.addRow(values);

    // Set the content type and headers for the response
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=FormData.xlsx');

    // Serialize the workbook to the response
    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    console.error('Error In Extracting Data In Excel:', error);
    res.status(500).json({ error: `Error In Extracting Data: ${error}` });
  }
});

const checkAuthorization =catchAsync(async(req,res)=>{
  try {
    console.log("req.userreq.userResponseData",req.userResponseData);
    res.json({ data:req.userResponseData })
  } catch (error) {
    console.log("error",error);
  }
});

export default {
  createRoiFormData,
  exportInExcel,
  checkAuthorization
};

