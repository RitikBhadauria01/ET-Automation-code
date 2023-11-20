// import taskModels from "../models/taskModels";
// import tasks from "../models/taskModels";
import sequalize from "../helpers/Sequalize";
import BotUser from "../models/BotUser";
import products from "../models/products";
import benefits_table from "../models/productBenifits";
import product_process from "../models/productProcess";

import productCluster from "../models/productCluster"
import productCountry from "../models/productCountry"

import businessUnit_table from "../models/BusinessUnitFilter";
import function_table from "../models/FunctionFilter";
import subArea_table from "../models/SubAreaFilter";

import ResponseObject from "../helpers/responseObjectClass";
// import jwt from "jsonwebtoken";
// import config from '../../config/env'
 const moment = require('moment');
import catchAsync from "../helpers/catchAsync";
import sequelize, { Op } from "sequelize";

//product page starting API
const createProduct = async (req, res, next) => {
    try{
        var benefits = req.body.benefits;
        var process = req.body.process;
        const product = await products.create({
            'lead_platform': req.body.lead_platform,
            'mco': req.body.mco,
            'area': req.body.area,
            'catalog_products': req.body.catalog_products,
            'product_status': 1,
            'subarea': req.body.subarea,
		 document_url: req.body.document_url,
      isDocument: req.body.isDocument,
            'product_title': req.body.product_title,
            'clusters_live': req.body.clusters_live,
            'product_caption': req.body.product_caption,
            'hrs_saved': req.body.hrs_saved,
"product_description": req.body.product_description,
            'hrs_saved_text': req.body.hrs_saved_text,
            'process_caption': req.body.process_caption,
            'product_banner': req.body.product_banner,
            'product_video': req.body.product_video,
            'area': req.body.area,
            'createdAt': moment().utc().format("hh:mm:ss") + moment().utc().format("YYYY-MM-DD")
        });
        const recent_product_id = product.dataValues.product_id;
	let cluster_data;
        req.body.lead.forEach(async(data)=>{
            cluster_data = await productCluster.create({
                'product_id': recent_product_id,
                'cluster': data.cluster
            })
            await data.country.forEach(async(data1)=>{
                console.log("vineeth data", data1);
                await productCountry.create({
                    'product_id': recent_product_id,
                    'clusterId':cluster_data.dataValues.id,
                    'country':data1
                })
            })
        })
        if(benefits){
        benefits.forEach(async(prod_benefits) => {
            var save_benefits = await benefits_table.create({
                'product_id':recent_product_id,
                'benefit':prod_benefits.benefit,
                'benefit_icon':prod_benefits.benefit_icon,
                'benefit_status':1
            });
        });
        }
        if(process){
        process.forEach(async(prod_process) => {
            var save_process = await product_process.create({
                'product_id':recent_product_id,
                'process_head':prod_process.process_head,
                'process_text':prod_process.process_text,
                'process_status':1
            });
        });
        }
        var data = [{
            'recent_product_id':recent_product_id
        }]
        res.send(new ResponseObject(200, 'Product created successfully', true, data));
    }  catch(e) {
        console.log("e = ",e)
        return res.status(500).json({error: e});
    }
}

const getProducts = async (req, res, next) => {
    try {
        var productData = "";
        var whereVar = {};
        const { product_id, cluster, clusters_live, catalog_products, page, size,search,product_title,pid } = req.body
        let offset = 0;
        let limit = 10;
        if (page) {
            offset = page && (parseInt(page - 1) || 0) * size
        }
        if (size) { limit = size; }
if (req.body.product_id == "All") {
            whereVar.product_status = 1
            cluster !== "" && (whereVar.cluster = {[Op.like]:"%"+cluster+"%"})
            catalog_products !== "" && (whereVar.catalog_products = catalog_products)
            clusters_live !== "" && (whereVar.clusters_live = clusters_live)
	    product_title!=="" && (whereVar.product_title={[Op.like]:"%"+product_title+"%"})
            // whereVar = {product_status: 1,cluster:req.body.cluster,catalog_products:req.body.catalog_products,clusters_live:req.body.clusters_live}
        } else {
            whereVar.product_id = product_id
            whereVar.product_status = 1
            cluster !== "" && (whereVar.cluster = {[Op.like]:"%"+cluster+"%"})
            catalog_products !== "" && (whereVar.catalog_products = catalog_products)
            clusters_live !== "" && (whereVar.clusters_live = clusters_live)
	    product_title!=="" && (whereVar.product_title={[Op.like]:"%"+product_title+"%"})
            // whereVar = {product_id:req.body.product_id,cluster:req.body.cluster,clusters_live:req.body.clusters_live,product_status:1,catalog_products:req.body.catalog_products}
        }
        if(search != null && search.length > 0){
            const obj={ [Op.or]: [{
                cluster: {
                    [Op.like]: `%${search}%`
                }
            },
            {
                catalog_products: {
                    [Op.like]: `%${search}%`
                }
            },
            {
                product_title: {
                    [Op.like]: `%${search}%`
                }
            }
        ]}
            search!=="" && whereVar[obj]
        }  
          let obj1 = { data: [] }
        let lead_array = [];
  let ProductsCount = await products.count({where: whereVar})      
productData = await products.findAll({
            limit: limit,
            offset: offset, where: whereVar,
               order: [['product_id', 'ASC']]
        }).then(async (data) => {
           
            // productData = await products.findAll({where: whereVar}).then(async(data) => {
            // let obj1 = {data:[]}
            // let lead_array = []; 
            await Promise.all(
                data.map(async (element) => {
                    var country_array = [];
                    var obj = {}; var obj_lead = {};
                   // obj.country = element.country;
                    obj.product_id = element.product_id;
                    obj.catalog_products = element.catalog_products;
                    obj.product_status = element.product_status;
                    obj.subarea = element.subarea;
			obj.document_url= element.document_url;
      			obj.isDocument= element.isDocument;
                    obj.product_title = element.product_title;
                    obj.clusters_live = element.clusters_live;
                    obj.product_caption = element.product_caption;
                    obj.product_icon = element.product_icon;
                    obj.hrs_saved = element.hrs_saved;
                    obj.hrs_saved_text = element.hrs_saved_text;
                    obj.product_banner = element.product_banner;
                    obj.product_video = element.product_video;
                    obj.area = element.area;
                    obj.pid = element.pid;
                    obj.process_caption = element.process_caption;
                    obj.createdAt = element.createdAt;
                    obj.updatedAt = element.updatedAt;
                    obj_lead.lead_platform = element.lead_platform;
                    obj.product_description = element.product_description;
                    //obj_lead.cluster = element.cluster;
                    //if(element.country){
                      //  obj_lead.country = element.country.split(',');
                    //}
                    //obj_lead.country = element.country;

                    lead_array.push(obj_lead)
                    obj.lead = lead_array;


                    obj.benefits_array = [];
                    obj.process_array = [];
			obj.leads=[];
                    await productCluster
                    .findAll({ where: { product_id: element.product_id } })
                    .then(async (benefit_items) => {
                     await benefit_items.forEach(async (ben_items) => {
                        let productCluster = {};
                        console.log("ben_items",ben_items)
                        productCluster.cluster = ben_items.cluster;
                      //   obj.leads.push(productCluster);
  
                        await productCountry
                      .findAll({ where: { product_id: element.product_id,clusterId:ben_items.dataValues.id } })
                      .then(async (benefit_items1) => {
                          let productCountry = [];
                          await benefit_items1.forEach(async (ben_items1) => {
                            console.log("benItems1",ben_items1)
                          productCountry.push( ben_items1.dataValues.country);
                        });
                        productCluster.country=productCountry
                        obj.leads.push(productCluster);
                      });
                      });
                    });

                    await benefits_table.findAll({ where: { product_id: element.product_id, benefit_status: 1 } }).then(async (benefit_items) => {
                        benefit_items.forEach(async (ben_items) => {
                            let benfits_obj = {};
                            benfits_obj.benefit_id = ben_items.benefit_id;
                            benfits_obj.benefit = ben_items.benefit;
                            benfits_obj.product_id = ben_items.product_id;
                            benfits_obj.benefit_icon = ben_items.benefit_icon;
                            obj.benefits_array.push(benfits_obj)
                        })
                    })

                    await product_process.findAll({ where: { product_id: element.product_id, process_status: 1 } }).then(async (process_items) => {
                        process_items.forEach(async (pro_items) => {
                            let process_obj = {};
                            process_obj.process_id = pro_items.process_id;
                            process_obj.process_head = pro_items.process_head;
                            process_obj.product_id = pro_items.product_id;
                            process_obj.process_text = pro_items.process_text;
                            obj.process_array.push(process_obj)
                        })
                    })
                    obj1.data.push(obj);
                }),
            )
    let newData=obj1.data
            newData.sort((a,b)=>{
              return (a.product_id - b.product_id);
            })
            
            console.log("line236",newData);
           
          
             let returnObj = new ResponseObject().create({
                code: 200,
                message: 'Product data fetched successfully',
                data:newData,
                success:true,
                total:ProductsCount
              });
console.log("line 242",returnObj)
            res.send(returnObj);
        })
    } catch (e) {
        console.log("error = ", e)
        return res.status(500).json({ error: e });
    }
}

    const updateProduct = async(req,res) => {
        try {
            var benefits = req.body.benefits;
            var process = req.body.process;
            var benefit_data = await benefits_table.update({
                benefit_status:0
            },{
                where: {
                    product_id: req.body.product_id
                }
            });

            const process_data = await product_process.update({
                process_status:0
            },{
                where: {
                    product_id: req.body.product_id
                }
            });
		productCluster.destroy({where:{product_id: req.body.product_id}})
        productCountry.destroy({where:{product_id: req.body.product_id}})
	let cluster_data;
         let productId = req.body.product_id;
         req.body.lead.forEach(async (data)=>{
         cluster_data = await productCluster.create({
             'product_id':productId,
             'cluster':data.cluster
         })
        await data.country.forEach(async (data1)=>{
             console.log("This data",data1)
                 await productCountry.create({
                         'product_id':productId,
                         'clusterId':cluster_data.dataValues.id,
                         'country':data1 
                     })
     })
     console.log('cluster_id',cluster_data.dataValues.id)
     })
            const updateproduct = await products.update({
                'lead_platform': req.body.lead_platform,
                'cluster': req.body.cluster,
                'country': req.body.country,
                'catalog_products': req.body.catalog_products,
                'subarea': req.body.subarea,
                'product_title': req.body.product_title,
                'clusters_live': req.body.clusters_live,
                'product_caption': req.body.product_caption,
                'hrs_saved': req.body.hrs_saved,
		'isDocument': req.body.isDocument,
  		'document_url': req.body.document_url,
'product_description':req.body.product_description,
                'hrs_saved_text': req.body.hrs_saved_text,
                'process_caption': req.body.process_caption,
                'product_banner': req.body.product_banner,
                'product_video': req.body.product_video,
                'area': req.body.area,
                'createdAt': moment().utc().format("hh:mm:ss") + moment().utc().format("YYYY-MM-DD")
            },
            {
                where: {
                    product_id: req.body.product_id,
                    product_status: 1
                }
            });

            
        benefits.forEach(async(prod_benefits) => {
            var save_benefits = await benefits_table.create({
                'product_id':req.body.product_id,
                'benefit':prod_benefits.benefit,
                'benefit_icon':prod_benefits.benefit_icon,
                'benefit_status':1
            });
        });
        process.forEach(async(prod_process) => {
            var save_process = await product_process.create({
                'product_id':req.body.product_id,
                'process_head':prod_process.process_head,
                'process_text':prod_process.process_text,
                'process_status':1
            });
            console.log("save_process = ",save_process)
        });
        res.send(new ResponseObject(200, 'Product data updated successfully', true, []));
        } catch (e) {
            console.log("error = ",e)
            return res.status(500).json({error: e});
        }
    }

    const deleteProduct = async (req, res) => {
        try {
            var benefit_data = await benefits_table.update({
                benefit_status:0
            },{
                where: {
                    product_id: req.body.product_id
                }
            });
		     productCluster.destroy({where:{product_id: req.body.product_id}})
           productCountry.destroy({where:{product_id: req.body.product_id}})
            const process_data = await product_process.update({
                process_status:0
            },{
                where: {
                    product_id: req.body.product_id
                }
            });
            const deleteProduct = await products.update({
                product_status:0,
                updatedAt: moment().utc().format("hh:mm:ss")
            },{
                where: {
                    product_id: req.body.product_id,
                    product_status: 1
                }
            });
            res.send(new ResponseObject(200, 'Product deleted successfully', true,deleteProduct));
        } catch (e) {
        return res.status(500).json({error: e});
        } 
    }
//product page ending API




// //create task api for mindtree to update task
// const taskCreate = async (req, res, next) => {
//     const values = await BotUser.Bot.findAll({where:{botExternalId: req.body.botID}});
//     console.log('token1', req.headers.authorization);
//     console.log('values', values)
//     jwt.verify(req.headers['authorization'],config.SECRET_KEY,async(err,res1)=>{
//         if(err){
//             console.log("Token Failed",err)
//             next(err)
//         }else{
//             try {
//                 if(values.length>0)
//                 {
//                    const checkTask = await tasks.findAll({where:{taskID: req.body.taskID,taskStatus:1}});
//                    console.log("checkTask = ",checkTask.length)
//                    if(checkTask.length>0)
//                    {
//                     res.send(new ResponseObject(400, 'Task Details already exist', false, []));
//                    } else {
//                         const task = await tasks.create({
//                             botExternalId: req.body.botID,
//                             taskName: req.body.taskName,
//                             taskId: req.body.taskID,
//                             projectName: req.body.projectName,
//                             taskStatus: 1,
//                             // createdAt: utctimedate    
//                         });
//                         res.send(new ResponseObject(200, 'Task Details created successfully', true, []));
//                    }
                    
//                 }else{
//                     res.send(new ResponseObject(200, 'Bot not found', false, []));
//                     //No Data related to bot
//                 } 
//             } catch (error) {
//                 next(error);   
//             }

//         }
//     })
//     //if token has error check the below line
// //    const token1 = await jwt.verify(req.headers['authorization'],"Unilever01!")



// }
  




// const taskUpdate= async (req, res, next) => {
//     const taskFind = await tasks.findAll({
//         where: {
//             taskId: req.body.taskID
//         }
//     })
//     if (taskFind.length > 0) {
//         const taskUpdate = await tasks.update({
//             taskStatus: req.body.taskStatus,
//             taskName: req.body.taskName
//         }, {
//             where: {
//                 taskId: req.body.taskID
//             }
//         })
//         res.send(new ResponseObject(200, 'Task updated successfully', true, []));
//     }
//     else{
//         res.send(new ResponseObject(400, 'Failed to Updated', false, []));
//     }
    
// }

const getProductFilters = catchAsync(async (req, res, next) => {
    let data = []
       // data.push({ key: "status", name: "Status", value: [{'status':'Live'}] })
    
await products.findAll({
        attributes: [
            [sequelize.fn('DISTINCT', sequelize.col('cluster')), 'cluster']
        ]
    }).then(async (data2) => {
        console.log("data", data2)
        let arr = [
            {'cluster':'SEAA'},
            {'cluster':'LATAM'},
            {'cluster':'North America'},
            {'cluster':'Africa'}, 
            {'cluster':'South Asia'}, 
            {'cluster':'South Africa'}, 
            {'cluster':'Europe'}, 
            {'cluster':'NAMETRUB'}, 
            {'cluster':'North America'}, 
            {'cluster':'Global'},
            {'cluster':'North Asia'},
        ]
        // data2.map((v)=>{
          //   if(v.cluster.includes(',')){
            //     v.cluster.split(/,(?![a-z A-Z 0-9]+\))/gm).map((v1)=>{
              //       arr.push(v1)
               //  })
            // }else{
              //   arr.push(v)
            // }
        // })

         data.push({ key: "cluster", name: "Cluster", value: [...new Set(arr)] })
    })
    res.send(new ResponseObject(200, 'Task Data', true, data));

});


// Filer Apis


const createOrUpdateBusinessUnit = async (req, res, next) => {
    try {
      let data = req.body;
      if (req.body.business_unit_id === -1) {
        const businessUnit = await businessUnit_table.create({
          cluster: req.body.cluster,
        });
        data = businessUnit.dataValues;
      } else {
        await businessUnit_table.update(
          {
            cluster: req.body.cluster,
          },
          {
            where: {
              business_unit_id: req.body.business_unit_id,
            },
          }
        );
      }
      res.send(new ResponseObject(200, 'Business Unit created/updated successfully', true, data));
    } catch (e) {
      console.log('e = ', e);
      return res.status(500).json({ error: e });
    }
  };
  
  const deleteBusinessUnit = async (req, res) => {
    try {
      const deleteBusinessUnit = await businessUnit_table.destroy({
        where: {
          business_unit_id: req.body.business_unit_id,
        },
      });
      res.send(new ResponseObject(200, 'Business Unit deleted successfully', true, req.body));
    } catch (e) {
      return res.status(500).json({ error: e });
    }
  };
  const createOrUpdateFunctionFilter = async (req, res, next) => {
    try {
      let data = req.body;
      if (req.body.function_id === -1) {
        const functionFilter = await function_table.create({
          function_name: req.body.function_name,
        });
        data = functionFilter.dataValues;
      } else {
        await function_table.update(
          {
            function_name: req.body.function_name,
          },
          {
            where: {
              function_id: req.body.function_id,
            },
          }
        );
      }
      res.send(new ResponseObject(200, 'Function filter created/updated successfully', true, data));
    } catch (e) {
      console.log('e = ', e);
      return res.status(500).json({ error: e });
    }
  };
  
  const deleteFunctionFilters = async (req, res) => {
    try {
      await function_table.destroy({
        where: {
          function_id: req.body.function_id,
        },
      });
      res.send(new ResponseObject(200, 'Function filter deleted successfully', true, req.body));
    } catch (e) {
      return res.status(500).json({ error: e });
    }
  };
  
  const createOrUpdateSubAreaFilters = async (req, res, next) => {
    try {
      let data = req.body;
      if (req.body.sub_area_id === -1) {
        const subArea = await subArea_table.create({
          sub_area: req.body.sub_area,
        });
        data = subArea.dataValues;
      } else {
        await subArea_table.update(
          {
            sub_area: req.body.sub_area,
          },
          {
            where: {
              sub_area_id: req.body.sub_area_id,
            },
          }
        );
      }
      res.send(new ResponseObject(200, 'SubArea created/updated successfully', true, data));
    } catch (e) {
      console.log('e = ', e);
      return res.status(500).json({ error: e });
    }
  };
  
  const deleteSubAreaFilter = async (req, res) => {
    try {
      const deleteSubArea = await subArea_table.destroy({
        where: {
          sub_area_id: req.body.sub_area_id,
        },
      });
      res.send(new ResponseObject(200, 'Sub Area deleted successfully', true, req.body));
    } catch (e) {
      return res.status(500).json({ error: e });
    }
  };
  const getFilterData = async (req, res, next) => {
    try {
      let business_array = [];
      let function_array = [];
      let subarea_array = [];
  
      let businessUnit = await businessUnit_table.findAll({});
      business_array = businessUnit.map(({ business_unit_id, cluster }) => ({
        business_unit_id,
        cluster,
      }));
  
      let functionData = await function_table.findAll({});
      function_array = functionData.map(({ function_id, function_name }) => ({
        function_id,
        function_name,
      }));
  
      let subArea = await subArea_table.findAll({});
      subarea_array = subArea.map(({ sub_area_id, sub_area }) => ({ sub_area_id, sub_area }));
  
      let data = new ResponseObject().create({
        code: 200,
        message: 'Filter data fetched successfully',
        success: true,
        data: { business_array, function_array, subarea_array },
      });
      res.send(data);
    console.log("line 714",data);
    } catch (e) {
      console.log('error = ', e);
      return res.status(500).json({ error: e });
    }
  };




export default {
    // taskCreate,
    // taskUpdate,
    createProduct,
    getProducts,
    deleteProduct,
    updateProduct,
    getProductFilters,
    getFilterData,
    createOrUpdateBusinessUnit,
    deleteBusinessUnit,
    createOrUpdateFunctionFilter,
    deleteFunctionFilters,
    createOrUpdateSubAreaFilters,
    deleteSubAreaFilter
};
