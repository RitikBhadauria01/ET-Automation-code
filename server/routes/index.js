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
import taskRoutes from './taskRoutes/taskRoutes'
import roiForm from './roiForm/roiForm';
//import { authenticateWebUser } from  '../helpers/msal'
import GetThisBotRoute from './GetThisBotRoute/getThisBot';
import SubmitAnIdeaRoutes from './submitAnIndea/ideaSubmittedBy'
import MailerRoutes from './Mailer/mailerRoutes';
//import {fetchTableAzure} from  '../controllers/azureDevTable.js'
import twinRoutes from './emplayeeTwin/twinRoutes';
import botSearch from './botSearch/botSearchRoutes';
import softSkill from './softSkill/softSkillRoutes';
import pollRoutes from './pollRoutes/pollRoutes';
import pinterestRoutes from './pinterest/pinModel';

const router = express.Router();
router.use('/mail', MailerRoutes);

router.use('/ideas', SubmitAnIdeaRoutes);
router.use('/connection', connectionRoutes);
router.use('/poll',pollRoutes);

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
//task routes
router.use('/task', taskRoutes);

// employee twin
router.use('/twin',twinRoutes);

// roiForm routes
router.use('/roi',roiForm);

// bot search
router.use('/botSearch',botSearch);

// soft skill
router.use('/softSkill',softSkill);

//pinterest API routes
router.use('/pinterest',pinterestRoutes);

export default router;
