import catchAsync from '../helpers/catchAsync';
import {ET_order} from '../models/ET_order';
import ResponseObject from '../helpers/responseObjectClass';
import BotUser from '../models/BotUser';
import employeeTwin from '../models/employeeTwin';
import Product_cart from "../models/productCart";
import products from "../models/products";
import ET_cart from '../models/ET_Cart_new';
import softSkill from '../models/softSkill';
const XLSX = require('xlsx');
import {ET_manage} from '../models/ET_manage';
import axios from "axios";


const employee_manage = catchAsync(async (req, res, next) => {
  await ET_manage.sync();

  try {
    // Read the Excel file
   // const fileUrl = 'https://bnlwestgunileveraf01091.blob.core.windows.net/botstorevideo/Aarambh%20October.xlsx';
    const fileUrl = req.body.filelink;
    
const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const fileData = response.data;

    // Read the Excel file
    const workbook = XLSX.read(fileData, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert Excel data to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    const { Month, Year } = jsonData[0]; // Assuming the month and year are in the first row of the Excel data

    // Delete existing records for the same month and year
    await ET_manage.destroy({
      where: {
        Month,
        Year,
      },
    });

    for (const data of jsonData) {
      const { Empid, Year, Cost, Month, Skill, usercount, Averagetime, Skilltype, interactions, Hits, Username } = data;
      console.log(Month);
      // Create a new instance of the ET_manage model
      let manage = await ET_manage.build({
        Empid,
        Year,
        Cost,
        Month,
        Skill,
        usercount,
        Averagetime,
        Skilltype,
        interactions,
        Hits,
        Username,
      });
      await manage.save();
    }

    console.log('Data inserted successfully.');
    res.send(new ResponseObject(200, true, 'Data inserted successfully.')); // Sending response after all data is inserted
  } catch (error) {
    console.error('Error inserting data:', error);
    res.send(new ResponseObject(500, false, 'Error inserting data.'));
  }
});

// Add appropriate error handling, variable definitions, and imports as needed
// Add appropriate error handling, variable definitions, and imports as needed
const getManageTwin = catchAsync(async (req, res, next) => {
  try {
    await ET_manage.sync(); // Sync the model with the database

    const data = await ET_manage.findAll(); // Fetch data from the table
    console.log('ET_manage', data);
    res.status(200).json({ data: data, code: 200 });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
const getDataByMonth = catchAsync(async (req, res, next) => {
  try {
    await ET_manage.sync(); // Sync the model with the database

    const currentDate = new Date(); // Get the current date
    const currentMonth = currentDate.getMonth(); // Get the current month (0-11)

    // Define an array of month names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const { year, month } = req.params; // Extract the year and month from the route parameters

    // Validate the year and month inputs
    if ((!year || !month) && !monthNames.includes(month)) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    // Convert the year to a number
    const yearNumber = parseInt(year, 10);

    // If year and month are provided, fetch data for the specified month
    if (year && month) {
      const data = await ET_manage.findAll({
        where: {
          Year: yearNumber,
          Month: month
        }
      });

      console.log('Data:', data);
      res.status(200).json({ data: data, code: 200 });
    } else {
      // If year and month are not provided, fetch data for the previous month

      let previousMonthIndex = (currentMonth - 1 + 12) % 12; // Calculate the index of the previous month

      // Handle the case where the current month is January
      if (previousMonthIndex < 0) {
        previousMonthIndex = 11;
      }
      const previousMonth = monthNames[previousMonthIndex]; // Get the previous month name
      const currentYear = new Date().getFullYear(); // Get the current year

      // Fetch data for the previous month
      const data = await ET_manage.findAll({
        where: {
          [Op.and]: [
            { Year: currentYear },
            { Month: previousMonth }
          ]
        }
      });
console.log('Previous Month Data', data);
      res.status(200).json({ data: data, code: 200 });
    }
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



export default {
  employee_manage,
  getManageTwin,
  getDataByMonth
}
