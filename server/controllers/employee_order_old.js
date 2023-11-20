import catchAsync from '../helpers/catchAsync';
import { ET_order } from '../models/ET_order';
import ET_cart from '../models/ET_Cart_new';

import ResponseObject from '../helpers/responseObjectClass';
import BotUser from '../models/BotUser';
import employeeTwin from '../models/employeeTwin';
import Product_cart from "../models/productCart";
import products from "../models/products";

const employee_order = catchAsync(async (req, res, next) => {
    let  epTable = await employeeTwin.employeeTwin.sync();
    const result = await epTable.findAll({
    });
    // console.log("line 15",epresult);
    const dataValues = result.map((result) => result.dataValues);
     console.log("line 17",dataValues);

    const valuesToCheck = [req.body.globalSkill];
   let newresult=[];
       newresult = valuesToCheck[0].split(',').filter(Boolean);
console.log("line number 20 ",newresult);
  const filteredData = dataValues.filter(obj => {
    const localSkillsArray = obj.globalSkill.split(',');
    return newresult.some(value => localSkillsArray.some(skill => skill.trim() === value));
  });
console.log("line number 29",filteredData);
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

     req.body.product_id = product_id;
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

//get Order
const get_order = catchAsync(async (req, res, next) => {
const table = await ET_order.sync();
     console.log("line 109",table)
const businessRequest = req.query.businessRequest;
console.log("line 110",businessRequest);
const result = await table.findAll({
        where: {
            businessRequest: businessRequest
        }
    })
    console.log("line 115",result);
    res.status(200).json({
        data:result,
code:200    })
});




//Product in purchase twin
const get_product= catchAsync(async (req, res, next) => {
console.log("inside getprdouct==>>>line 1221221221")
    const table = await products.sync();
    console.log("line 109",table)
const product_id = req.query.product_id;
console.log("line 110",product_id);
const result = await table.findAll({
       where: {
        product_id: product_id
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

export default {
    employee_order,
    get_order,
       get_product,
    store_product,
    getProductCart,
   getProductCartNew
}
