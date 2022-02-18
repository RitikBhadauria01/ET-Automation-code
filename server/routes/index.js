import express from 'express';
import connectionRoutes from '../routes/connections/connectionRoutes'
import UserRoutes from '../routes/user/userRoutes'
import DemandRoutes from '../routes/demand/demandRoutes'
import ContactRoutes from './contactUs/contact'
import BotRoutes from './botStore/botRoutes'
import ElasticRoutes from './elasticRoutes/elasticRoute'
import FrameworkRoutes from './framework/frameworkRoutes'
import AzureRoutes from './azureRoutes/azureRoutes'
import RequestDemoRoutes from './requestDemoRoutes/requestDemo'
import LoginRoutes from './msalLoginRoutes/loginRoutes'
import GfcfRoutes from './gfcfRoutes/gfcfRoutes'
//import { authenticateWebUser } from  '../helpers/msal'
import GetThisBotRoute from './GetThisBotRoute/getThisBot';
import SubmitAnIdeaRoutes from './submitAnIndea/ideaSubmittedBy'
import MailerRoutes from './Mailer/mailerRoutes';
//import {fetchTableAzure} from  '../controllers/azureDevTable.js'

const router = express.Router();
router.use('/mail', MailerRoutes);

router.use('/ideas', SubmitAnIdeaRoutes);
router.use('/connection', connectionRoutes)

// login routes
router.use('/login', LoginRoutes);
router.use('/elastic', ElasticRoutes);
// contact routes

//router.use(authenticateWebUser);

router.use('/contact', ContactRoutes)
// user routes
router.use('/gfcf', GfcfRoutes);
router.use('/user', UserRoutes);
// bot routes
router.use('/bot',BotRoutes);
// demands Routes
router.use('/demands',DemandRoutes)
// bot table

// framework 
router.use('/framework', FrameworkRoutes);
router.use('/azure', AzureRoutes);
router.use('/demo', RequestDemoRoutes);

router.use('/getBot', GetThisBotRoute);
export default router;
