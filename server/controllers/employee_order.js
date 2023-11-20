import catchAsync from '../helpers/catchAsync';
import {ET_order}  from '../models/ET_order';
import ResponseObject from '../helpers/responseObjectClass';
import BotUser from '../models/BotUser';
import employeeTwin from '../models/employeeTwin';
//anshu ma'am added routes
import Product_cart from "../models/productCart";
import products from "../models/products";
import ET_cart from '../models/ET_Cart_new';
import softSkill from '../models/softSkill';
//end routes

{/*const employee_order = catchAsync(async (req, res, next) => {
    let  epTable = await employeeTwin.employeeTwin.sync();
    const result = await epTable.findAll({
    });
    // console.log("line 15",epresult);
    const dataValues = result.map((result) => result.dataValues);
    console.log("line 17",dataValues);

    const valuesToCheck = [req.body.globalSkill];
    console.log("line1222121=>>>> value Checked ",valuesToCheck)
   let newresult=[];
       newresult = valuesToCheck[0].split(',').filter(Boolean);
console.log("line number 20555 newResult ",newresult);
  const filteredData = dataValues.filter(obj => {
    const localSkillsArray = obj.globalSkill.split(',');
console.log("line 4455554==>>> localSkillArray ",localSkillsArray)
    return newresult.some(value => localSkillsArray.some(skill => skill.trim() === value));
  });
console.log("line number 29",filteredData);
// console.log(filteredData[0].goLiveDate);

//   const filteredDataWithSelectedProps = filteredData.map(obj => {
//     return {
//       leadPlatform: obj.leadPlatform,
//       manualhour: obj.manualhour
//     };
//   });

filteredData.sort(function(a,b){
    return new Date(b.goLiveDate) - new Date(a.goLiveDate);
  });

  console.log("line 65",filteredData);
  console.log("line 66=>>>",filteredData[0].goLiveDate)
  const table = await ET_order.sync();
    let order__id = await table.findAll().then(row => {
        const row_length = row.length;
        let previous_id = row[row_length - 1].dataValues.id;
        return previous_id + 1;
    }).catch((err) => { console.log('err', err) });
  if (typeof (order__id) == 'undefined') {
      order__id = '#00001';
  } else if (order__id < 10) {
      order__id = '#0000' + order__id;
  } else if (order__id < 100) {
      order__id = '#000' + order__id;
  } else if (order__id < 1000) {
      order__id = '#00' + order__id;
  } else if (order__id < 10000) {
      order__id = '#0' + order__id;
  } else {
      order__id = '#' + order__id;
  }
  req.body.orderID = order__id;

  req.body.goLiveDate = filteredData[0].goLiveDate;

    
  let order = ET_order.build(req.body);
  let response = await order.save();
  
//   console.log(filteredDataWithSelectedProps);
let  data2 = filteredData[0].goLiveDate
const msg = 'Successfully created'
try {
    res.send(new ResponseObject(200, msg, true, response,data2 ));
    // res.status(200).json({
    //  response,
    //  data2:epresult[0].goLiveDate
    // })
} catch (err) { console.log('err', err) }
});
*/}


const employee_order = catchAsync(async (req, res, next) => {
  let epTable = await employeeTwin.employeeTwin.sync();
  const result = await epTable.findAll({});
  const dataValues = result.map((result) => result.dataValues);
  console.log("line 17",dataValues);
const valuesToCheck = [req.body.globalSkill, req.body.softSkill, req.body.localSkill];
console.log("line 20",valuesToCheck);

const filteredValues = valuesToCheck.filter(val => val);
console.log("line 24",filteredValues);
const valuesToFilterBy = filteredValues[0].split(',');
console.log("line 26",valuesToFilterBy);
const filteredData = dataValues.filter(item => {
  const globalSkills = item.globalSkill ? item.globalSkill.split(',') : [];
  const localSkills = item.localSkill ? item.localSkill.split(',') : [];
  const softSkills = item.softSkill ? item.softSkill.split(',') : [];

  const skills = [...globalSkills, ...localSkills, ...softSkills];

  return valuesToFilterBy.some(value => skills.includes(value));
});
filteredData.sort(function (a, b) {
  return new Date(b.goLiveDate) - new Date(a.goLiveDate);
});
 console.log("line 40",filteredData[0].goLiveDate);

  const table = await ET_order.sync();
  let order__id = await table
    .findAll()
    .then((row) => {
      const row_length = row.length;
      let previous_id = row[row_length - 1].dataValues.id;
      return previous_id + 1;
    })
    .catch((err) => {
      console.log('err', err);
    });
  if (typeof order__id == 'undefined') {
    order__id = '#00001';
  } else if (order__id < 10) {
    order__id = '#0000' + order__id;
  } else if (order__id < 100) {
    order__id = '#000' + order__id;
  } else if (order__id < 1000) {
    order__id = '#00' + order__id;
  } else if (order__id < 10000) {
    order__id = '#0' + order__id;
  } else {
    order__id = '#' + order__id;
  }
  req.body.orderID = order__id;

  let order = ET_order.build({
    product_id:req.body.product_id,
    goLiveDate: filteredData[0].goLiveDate,
    localSkill:req.body.localSkill,
    softSkill:req.body.softSkill,
    globalSkill:req.body.globalSkill,
    businessRequest:req.body.businessRequest,
        GlobalSkill_ProcessName:req.body.GlobalSkill_ProcessName,
    localSkill_ProcessName:req.body.localSkill_ProcessName,
    softSkill_ProcessName:req.body.softSkill_ProcessName,
    productSkill_ProcessName:req.body.productSkill_ProcessName, 
   orderID:order__id,
   ETname:req.body.ETname,
    Etprofile:req.body.Etprofile,
  });
  let response = await order.save();

  //   console.log(filteredDataWithSelectedProps);
  let data2 = filteredData[0].goLiveDate;
  const msg = 'Successfully created';
  try {
    res.send(new ResponseObject(200, msg, true, response, data2));

  } catch (err) {
    console.log('err', err);
  }
});


//updated get order API Anshu 
{/*const get_order = catchAsync(async (req, res, next) => {
    const table = await ET_order.sync();
    console.log("line 109",table)
const businessRequest = req.query.businessRequest;
console.log("line 110",businessRequest);
const result = await table.findAll({
       where: {
           businessRequest: businessRequest
       }
   })

   const dataValues = result.map((result) => result.dataValues);

   const updatedData = dataValues.map(item => {
       const createdAtDate = new Date(item.createdAt);
       const updatedCreatedAt = new Date(createdAtDate.setDate(createdAtDate.getDate() + 2));
       item.updatedAt = updatedCreatedAt.toISOString();
       return item;
     });
     
    //  const extractedData = updatedData.map(item => ({
    //    orderID: item.orderID,
    //    createdAt: item.createdAt
    //  }));
     
    //  console.log(extractedData);
   res.status(200).json({
       data:updatedData,
       code:200,
   })
});*/}{/*
const get_order = catchAsync(async (req, res, next) => {
  const table = await ET_order.sync();
  console.log('line 109', table);
  const businessRequest = req.query.businessRequest;
  console.log('line 110', businessRequest);
  const result = await table.findAll({
    where: {
      businessRequest: businessRequest,
    },
  });

  const dataValues = result.map((result) => result.dataValues);
  console.log("line number 308",dataValues)
  const updatedData = dataValues.map((item) => {
    const createdAtDate = new Date(item.createdAt);
    const updatedCreatedAt = new Date(createdAtDate.setDate(createdAtDate.getDate() + 2));
    item.createdAt = updatedCreatedAt.toISOString();
    item.updatedAt = updatedCreatedAt.toISOString();
    return item;
  });

  const idArray = updatedData.map((item) => item.globalSkill);
  const resultArrayGlobal = idArray.flatMap((item) => item.split(','));
  const idArrayNew = updatedData.map((item) => item.localSkill);
  const resultArrayLocal = idArrayNew.flatMap((item) => item.split(','));
  const idArrayNewSoft = updatedData.map((item) => item.softSkill);
  console.log("line 323",idArray);
  console.log("line 323",idArrayNew);
  console.log("line 323",idArrayNewSoft);
  const resultArraySoft = idArrayNewSoft.flatMap((item) => item.split(','));
  const idArrayProdut = updatedData.map((item) => item.product_id);
  const resultArrayProduct = idArrayProdut.flatMap((item) => item.split(','));


  const resultSoft = await BotUser.Bot.findAll({
    where: {
      botID: resultArrayGlobal,
    },
  });

  const resultSoftSec = await BotUser.Bot.findAll({
    where: {
      botID: resultArrayLocal,
    },
  });

  const resultSoftSkill = await softSkill.findAll({
    where: {
        softSkillID: resultArraySoft,
    },
  });
  const resultProduct= await products.findAll({
    where: {
        product_id: resultArrayProduct,
    },
  });

  const dataValuesSkil = resultSoft.map((result) => result.dataValues);
  const dataValuesSkilNew = resultSoftSec.map((result) => result.dataValues);
  const dataValuesSoft = resultSoftSkill.map((result) => result.dataValues);
  const dataValuesProduct = resultProduct.map((result) => result.dataValues);


  const processName = dataValuesSkil.map((result) => result.processName);
  const processNameNew = dataValuesSkilNew.map((result) => result.processName);
  const processNameSoft = dataValuesSoft.map((result) => result.skillName);
  const processNamePrdouct= dataValuesProduct.map((result) => result.product_title);


  //   const extractedData = updatedData.map(item => ({
  //     orderID: item.orderID,
  //     createdAt: item.createdAt
  //   }));

  //   console.log(extractedData);
  res.status(200).json({
    data: result,
    updateData: updatedData,
    globalSkillProcessName: processName,
    localSkillProcessName: processNameNew,
    softSkillProcessName: processNameSoft,
    prdouctTitle:processNamePrdouct,
    code :200
  });
});

*/}
const get_order = catchAsync(async (req, res, next) => {
  const table = await ET_order.sync();
  console.log('line 109', table);
  const businessRequest = req.query.businessRequest;
  console.log('line 110', businessRequest);
  const result = await table.findAll({
    where: {
      businessRequest: businessRequest,
    },
  });

  const dataValues = result.map((result) => result.dataValues);
  dataValues.sort((b, a) => a.orderID - b.orderID);

// console.log("line 102",dataValues);
  // console.log("line 100",dataValues);
  const updatedData = dataValues.map((item) => {
    const createdAtDate = new Date(item.createdAt);
    const updatedCreatedAt = new Date(createdAtDate.setDate(createdAtDate.getDate() + 2));
    item.createdAt = updatedCreatedAt.toISOString();
    item.updatedAt = updatedCreatedAt.toISOString();
    return item;
  });

  //   console.log(extractedData);
  res.status(200).json({
    data: updatedData,
    code :200
    
  });
});
//anshu ma'am
//Product in purchase twin
const get_product= catchAsync(async (req, res, next) => {
    const table = await products.sync();
    console.log("line 109",table)
const product_id = req.query.product_id;
console.log("line 110",product_id);
const result = await table.findAll({
       where: {
        pid: product_id
       }
   })
   console.log("line 115",result);
   res.status(200).json({
       data:result,
       code:200
   })
});


const store_product= catchAsync(async (req, res, next) => {
    try {
            const table = await Product_cart.Product_cart.sync(); 
//   let { product_id, product_name, businessrequest, cluster,area,subarea } = req.body;
const cart =table.build(req.body);
const cartResponse = await cart.save();

 console.log("line 115",cartResponse);
 res.status(200).json({
     data:cartResponse
 })
        
    } catch (error) {
       console.log("line 129",error); 
    }

});



const getProductCart =catchAsync(async (req,res,next)=>{
    try {
        const businessRequest =req.body.businessRequest;
    let  epTable = await ET_cart.ET_cart.sync();
    const result = await epTable.findAll({
        where: {
            businessRequest: businessRequest
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
        product_id: split_string_Product,
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
//end


const getProductCartNew =catchAsync(async (req,res,next)=>{
    try {
        // const businessrequest =req.body.businessrequest;
    let  epTable = await Product_cart.Product_cart.sync();
    const result = await epTable.findAll({ });
    // console.log("line 143",result);
    const dataValues = result.map((result) => result.dataValues);
    // console.log("line 178",dataValues);
    const idArray = dataValues.map(item => item.product_id);
    //  console.log("line 180",idArray);
     const resultArray = idArray.flatMap(item => item.split(','));

    //  console.log("line 183",resultArray);
    const tableSoft = await products.sync();
    const resultSoft = await tableSoft.findAll({
      where: {
        product_id: resultArray,
      },
    });
 console.log("line 155",resultSoft);
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
const getTwinname= catchAsync(async (req, res, next) => {
  const table = await ET_order.sync();
const result = await table.findAll({
})
//  console.log("line 115",result);
 const dataValues = result.map((result) => result.dataValues);
     const idArray = dataValues.map(item => item.ETname);
 res.status(200).json({
     data:idArray,
     code:200
 })
});
export default {
    employee_order,
    get_order,
     get_product,
    store_product,
    getProductCart,
    getProductCartNew,
    getTwinname
}

