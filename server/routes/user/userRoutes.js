import express from 'express';
import {
    createUsers
    , getUserData
    , updateUserData,
    deleteUser,
    userLogin,
    getAllUser,
    getUserUsingPrimaryKey,
    createBusinnesOwner,
    updateUserPersonalData
} from '../../controllers/usersController';
const router = express.Router();


import { authenticateWebUser } from  '../../helpers/msal'

router.use(authenticateWebUser);
router.post('/createBO', createBusinnesOwner);

router.post('/createUser', createUsers);
// get user
router.get('/getUser', getUserData);
// convert to patch
router.put('/updateUserDetails', updateUserData);

router.put('/updateUserPersonalDetails', updateUserPersonalData)
// delete users
router.delete('/deleteUser', deleteUser);

router.get('/login', userLogin);
router.get('/allUser', getAllUser);
router.get('/getAUser', getUserUsingPrimaryKey);
export default router