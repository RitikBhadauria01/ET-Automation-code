import express from 'express';
const router = express.Router();
import{
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

} from '../../controllers/taskController';




// router.post('/taskCreate', taskCreate);
router.post('/createProduct', createProduct);
router.post('/getProducts', getProducts);
router.post('/deleteProduct', deleteProduct);
router.post('/updateProduct', updateProduct);
// router.post('/taskUpdate', taskUpdate);
router.get('/getProductFilters', getProductFilters);

// Createor Update and Delete Filters
router.get('/getFilterData', getFilterData);
router.post('/createOrUpdateBusinessUnit', createOrUpdateBusinessUnit);
router.post('/deleteBusinessUnit', deleteBusinessUnit);
router.post('/createOrUpdateFunctionFilter', createOrUpdateFunctionFilter);
router.post('/deleteFunctionFilters', deleteFunctionFilters);
router.post('/createOrUpdateSubAreaFilters', createOrUpdateSubAreaFilters);
router.post('/deleteSubAreaFilter', deleteSubAreaFilter);

export default router;



