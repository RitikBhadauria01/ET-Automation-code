import express from 'express';
import {
addSkillMailAPI,
deleteSkillMailAPI,
createTwin,
 getTwin,
 DltLocalGlobalSkillTwin,
 sumManulAndFte, 
feedBackApi, 
searchTwin, 
documentLink,
updateCart,
deleteCart,
randomMailData,
localGlobalCartTwin,
getAllTwinData,
getLeadPlatform,
getArea,getSubArea,
updateCartNew,
purchasecartTwin,
deletepurchaseCart,
orderMailData,
searchSoftSkill,
getAreaProduct,
getSubAreaProduct, 
getProductEmployeetwin, 
getallSkillsByET,
 searchTwin2, 
localGlobalSkillTwin,
virtualDeleteApi,
getTwinDataByET,
getPerSkillNew, 
getETbyLeadPlatform,
 getAllVirtualDeleteApi,
 reverseaddedApi,
getTwinDataindividualET,
rookieDataByET,
CheckoutMailAPI,
createdSkillRating,getSkillRating,userTrafficGraph,
createET_user,getET_user,deleteET_user,getAllET_user,
getAllUsers,createInvoiceTable,getCostCenterData,updateCostCenterData,emailCostCenterdata,generatePDFAPI,getAllReviews, toggleSkillsToMinicart,getselectedSkills,deleteSelectedSkill,createCartFormDataEntry } from '../../controllers/twinController';
import {employee_order, get_order,get_product,store_product, getProductCart,getProductCartNew,getTwinname} from '../../controllers/employee_order';
import { authenticateWebUser } from '../../helpers/msal';
import {employee_manage,getManageTwin,getDataByMonth}  from '../../controllers/employee_manage';
const router = express.Router();

router.use(authenticateWebUser);

router.post('/deleteSkillMail',deleteSkillMailAPI);
router.post('/addSkillMailAPI',addSkillMailAPI);
router.post('/employeeTwin', createTwin);
router.get('/search?:empTwinId', searchTwin);
router.get('/get', getTwin);
router.get('/localSkill?:empTwinId', localGlobalSkillTwin);
router.get('/globalSkill?:empTwinId', localGlobalSkillTwin);
router.delete('/localSkill', DltLocalGlobalSkillTwin);
router.delete('/globalSkill', DltLocalGlobalSkillTwin);
router.delete('/softSkill', DltLocalGlobalSkillTwin);
router.delete('/productSkill', DltLocalGlobalSkillTwin);

router.post('/employee_order',employee_order);
router.get('/employee_order?:businessRequest',get_order);
router.post('/feedback', feedBackApi);
router.get('/sumManulAndFte', sumManulAndFte);
router.post('/documentLink', documentLink); 
//// random mail
router.post('/randomMail', randomMailData);

//cart routes
router.post('/updateCart', updateCart);
router.delete('/globalSkill/cart', deleteCart);
router.delete('/localSkill/cart', deleteCart);
router.delete('/softSkill/cart', deleteCart);
router.post('/cartBotSearch', localGlobalCartTwin);

//latest purchase
router.post('/getAllTwinData', getAllTwinData);
router.post('/getLeadPlatform', getLeadPlatform);
router.post('/getArea', getArea);
router.post('/getSubArea', getSubArea);
router.post('/updateCartNew', updateCartNew);
router.post('/purchasecartTwin', purchasecartTwin);
router.delete('/globalSkill/deletepurchaseCart', deletepurchaseCart);
router.delete('/localSkill/deletepurchaseCart', deletepurchaseCart);
router.delete('/softSkill/deletepurchaseCart', deletepurchaseCart);

//
router.get('/get_product?:product_id', get_product);
router.post('/store_product', store_product);
router.post('/getProductCart', getProductCart);
router.delete('/product/deletepurchaseCart', deletepurchaseCart);
router.get('/getProductCartNew',getProductCartNew);

//order mail API
router.post('/orderMail', orderMailData);

router.post('/searchSoftSkill',searchSoftSkill);

//product filter
router.post('/getAreaProduct', getAreaProduct);

router.post('/getSubAreaProduct', getSubAreaProduct);

router.post('/getProductEmployeetwin', getProductEmployeetwin);

router.get('/getTwinname',getTwinname);

router.post('/manageet', employee_manage);
router.get('/getmanagetwin/:year/:month?', getDataByMonth);
router.get('/getmanagetwin', getManageTwin);

//latest routes
router.get('/getallSkillsByET?:empTwinId', getallSkillsByET);
router.get('/twinsoftskill?:empTwinId', searchTwin2);
router.get('/transactions?:empTwinId', localGlobalSkillTwin);
router.get('/reporting?:empTwinId', localGlobalSkillTwin);
router.get('/cognitive?:empTwinId', localGlobalSkillTwin);
router.get('/decisionautomations?:empTwinId', localGlobalSkillTwin);
router.get('/genAI?:empTwinId', localGlobalSkillTwin);
router.post('/virtualDeleteApi', virtualDeleteApi);
router.get('/getTwinDataByET', getTwinDataByET);
router.post('/getPerSkillNew', getPerSkillNew);
router.post('/getETbyLeadPlatform',getETbyLeadPlatform);
router.post('/getAllVirtualDeleteApi', getAllVirtualDeleteApi);
router.post('/reverseaddedApi', reverseaddedApi);
router.get('/getTwinDataindividualET?:empTwinId', getTwinDataindividualET);
router.get('/rookieDataByET', rookieDataByET);
router.post('/CheckoutMailAPI',CheckoutMailAPI);
router.post('/skill-rating', createdSkillRating);
router.post('/getSkillRating', getSkillRating);
router.post('/userTrafficGraph', userTrafficGraph);

router.get('/getAllUsers', getAllUsers);

router.post('/createET_user', createET_user);
router.post('/getET_user', getET_user);
router.delete('/deleteET_user', deleteET_user);
router.get('/getAllET_user', getAllET_user);

router.post('/getformdata', createInvoiceTable);
router.get('/getCostCenterData', getCostCenterData);
router.post('/updateCostCenterData', updateCostCenterData);
router.post('/emailCostCenterdata', emailCostCenterdata);
router.post('/generatePDF', generatePDFAPI);

router.get('/getAllReviews?:reviewID',getAllReviews);

// cart api's
router.post('/toggleSkillsToMinicart',toggleSkillsToMinicart);
router.get('/getselectedSkills',getselectedSkills);
router.get('/deleteSelectedSkill',deleteSelectedSkill);

router.post('/createCartFormDataEntry',createCartFormDataEntry);


export default router;

