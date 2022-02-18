// // coonnection 4
// // table service 
// import azure from "azure-storage";
// // fetch data 
// //send in response  
// import catchAsync from '../helpers/catchAsync';

// import ResponseObject from '../helpers/responseObjectClass';



// const fetchTableAzure = catchAsync(async (req, res, next) => {
//     console.log("d");
//     let primaryKey = 'CNa905fM8jUHT1IMu+/54zYzManyHzA1QlioaAssGcUoM7On9IW+jsA4cjEsjh4c35iotCvnXYSVCFiGkq+IcA==';
//     let accunt = 'afportaldev';
//     let sharedAcess ='SharedAccessSignature=sv=2020-04-08&ss=btqf&srt=sco&st=2021-05-08T14%3A23%3A42Z&se=2021-05-09T14%3A23%3A42Z&sp=rl&sig=fUyB9M%2BdY7RHRwyWYl2%2F3lrbl3Ub%2BGYtQknZtICsTWg%3D;BlobEndpoint=https://afportaldev.blob.core.windows.net/;FileEndpoint=https://afportaldev.file.core.windows.net/;QueueEndpoint=https://afportaldev.queue.core.windows.net/;TableEndpoint=https://afportaldev.table.core.windows.net/;'
//     let TableEndpoint="https://afportaldev.table.core.windows.net/";
//     let tableService = azure.createTableService(accunt, primaryKey, TableEndpoint);
//     let finalData = [];
//     var tableQuery = new azure.TableQuery().top(1000);
//         //.where('PartitionKey eq ?', 'Customer Development');
//     let table =await tableService.queryEntities('RPABotRepository',tableQuery,null,async function (error, result, response) {
//         if (!error) {
//             await finalData.push(result);
//             console.log('result  --', result.entries.length);
//             res.send(new ResponseObject(200, 'found', true, finalData));
//             // result contains the entity
//         }
//     }
//         );
//    // console.log("tabble  ---", table);
//    // res.send(new ResponseObject(200, 'found', true, finalData));
// })
// export default {
//     fetchTableAzure
// }