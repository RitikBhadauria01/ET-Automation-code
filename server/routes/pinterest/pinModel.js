import express from 'express';
const router = express.Router();
import { getclusterFunctionData,
    getAllUsers,
    getStaticFinanceData,
    getStaticSupplyChainData,
    getNewProductDateWise,
    manHoursSaved,
    buyNowDataAPI,
    commentAPI,
    getAllLike,
    getAllComments,
    shareAPI,
    pinAPIforMyself,
    pinAPIforOthers,
    getNotifications,
    likeUnlikeAPI,
    // deletePin,
    ratingAPI,
    getAverageRating,
    getUserProfile,
    // productStatus,
    getFunctionData,
    unPin,
    getAllProducts,
    //productAddTagLine,
    getProductsByTagline,
    getProductsByPins,
    getRatingByUser
 } from '../../controllers/pinterest';
 import { authenticateWebUser } from '../../helpers/msal';

 router.use(authenticateWebUser);

router.get('/getAllUsers', getAllUsers);
router.get('/getClusterData', getclusterFunctionData);
router.get('/getStaticFinanceData', getStaticFinanceData);
router.get('/getStaticSupplyChainData', getStaticSupplyChainData);
router.get('/getNewProductDateWise', getNewProductDateWise);
router.post('/manHoursSaved', manHoursSaved);
router.post('/buyNow',buyNowDataAPI);
router.post('/commentAPI',commentAPI);
router.get('/getAllLike',getAllLike);
router.get('/getAllComments',getAllComments);
router.post('/shareAPI',shareAPI);
router.post('/pinAPIforMyself',pinAPIforMyself);
router.post('/pinAPIforOthers',pinAPIforOthers);
router.get('/getNotifications',getNotifications);
router.post('/likeUnlikeAPI',likeUnlikeAPI);
// router.post('/deletePin',deletePin);
router.post('/ratingAPI',ratingAPI);
router.get('/getAverageRating',getAverageRating);
router.get('/getUserProfile',getUserProfile);
// router.get('/getProduct',productStatus);
router.get('/getFunctionData',getFunctionData);
router.get('/unPin',unPin);
router.get('/getAllProducts',getAllProducts);
//router.post('/productAddTagLine',productAddTagLine);
router.get('/getProductsByTagline',getProductsByTagline);
router.get('/getProductsByPins',getProductsByPins);
router.get('/getRatingByUser',getRatingByUser);


export default router;
