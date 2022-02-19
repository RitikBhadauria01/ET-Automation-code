import { DataTypes } from 'sequelize';

import sequelize from '../helpers/Sequalize';

const User = sequelize.define('Users', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  cluster: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  leadPlatform: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  area: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subArea: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mco: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  personalCluster: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  personalCountry: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  personalLeadPlatform: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  personalArea: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  personalSubArea: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  personalMco: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
 

});

const Bot = sequelize.define(
  'Bots',
  {
    // initail fields
    botID: {
      // primarykey auto genrated
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    parentBotID: {
      type: DataTypes.CHAR(50),
      allowNull: true,
    },
    leadPlatform: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    area: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    subArea: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    cluster: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    mco: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    country: { // country and geopraphy are same
      type: DataTypes.TEXT,
      allowNull: false,
    },
    primaryApplication: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    applications: { // same as application-involved
      type: DataTypes.TEXT,
      allowNull: false,
    },
    toolUsed: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    deliveryModel: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    status: {
      // to fix this field ? // be changed by qa user type only
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    dateOfStatusChanged: { // be changed by qa user type only
      type: DataTypes.DATE,
      allowNull: true,
    },
    businessOwnerComments:{ // businness owner comments
      type: DataTypes.TEXT,
      allowNull: true,
    },
    commentsForStatusChanged: { // be changed by qa user type only
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processID: {
      // supporting section // send tbd in no process id
      type: DataTypes.STRING,
      allowNull: false,
    },
    processName: {  //// ?????
      type: DataTypes.CHAR(200),
      allowNull: false,
    },
    processCriticality: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    processDescription: {  // 
      type: DataTypes.TEXT,
      allowNull: false,
    },
    kfa: {
      // rpa specific
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    kfaTransactional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    kfaInformational: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    kfaIuc: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    requestType: {  
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    requesterEmailID: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    engagementLead: {
      type: DataTypes.CHAR(100),
      allowNull: false,
    },
    initiatedBy: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    dataClassification: {
      // supporting section
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    remarks: {
      // supporting section
      type: DataTypes.TEXT,
      allowNull: true,
    },
    buildName: {
      // supporting section
      type: DataTypes.TEXT,
      allowNull:false,
    },
    supportStatus: {
      // supporting section
      type: DataTypes.TEXT,
      allowNull: false,
    },
    technology: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    dateLogged: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    sopReceivedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    tCode: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    hoursSavedYearly: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    businessOwnerEmailID: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdBy: { // autopopulated
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
    numberOfRunsInAMonth: {
      // supporting section
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    averageTime: {
      // supporting section
      type: DataTypes.STRING,
      allowNull: false,
    },
    sopDocument: {
      // supporting documnet section
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pddDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(50),
      allowNull: true,
    },
    pddApprovalDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    sddDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    qsgDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    odiDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    brdDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    costApprovalDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    explicitLandscapeApplicationOwnerApprovalDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    explicitGPMApprovalSupplyChainFinanceDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    explicitGFCFApprovalDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    devQualityCredentialsAvailableDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    infosecApprovalDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    dAReviewSignOffDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    testDataAvailableForDevelopmentDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    requestRaisedForProductionCredentialsDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    internalTestingCompletedDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    peerReviewSignOffDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    daReviewSecondSignOffDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    bpReleaseSignOffFromDaDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    uatScriptsWithResultsDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    uatSignOffDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    releaseManagerSignOffDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    gateFormDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    peerReviewchecklistDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    qaSignOffDocument: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    walkthroughVideo: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    ktVideo: {
      // supporting documnet section
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    costApprovalDate: {
      //bot delivery filedss
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    pddSignOffDate: {
      //bot delivery filedss
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    testStartDate: {
      //bot delivery filedss
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    goLiveDate: {
      //bot delivery filedss
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    bauDate: {
      //bot delivery filedss
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    lastModifiedDate: {
      //bot delivery filedss
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    landscapeApprover: { // email
      // approvals
      type: DataTypes.CHAR(100),
      allowNull:true,
    },
    landscapeApproval: {
      // approvals
      type: DataTypes.BOOLEAN,
      allowNull:true,
    },
    controlImpacted: {
      // approvals
      type: DataTypes.CHAR(50),
      allowNull: true,
    },
    nameofControlImpacted: {
      //(If yes mention control)
      // approvals
      type: DataTypes.CHAR(50),
      allowNull: true,
    },
   iuc: {
      // approvals
      type: DataTypes.BOOLEAN,
      allowNull:true,
    },
    approvedBy: {
      type: DataTypes.CHAR(50),
      allowNull: true,
    },
    approvalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    firstLevelgfcfApprover: { // name or email
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    firstLevelgfcfApprovalStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    firstLevelGfcfApprovalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    firstLevelGfcfComment: {
      type: DataTypes.TEXT,
      allowNull:true,
    },
    secondLevelGfcfApprover: {
      // approvals
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    secondLevelGfcfApprovalStatus:{
      type: DataTypes.BOOLEAN,
      allowNull:true,
    },
    secondLevelGfcfApprovalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    secondLevelGfcfComment: {
      type: DataTypes.TEXT,
      allowNull:true,
    },
    firstLevelGpmApprover: {
      // approvals
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    firstLevelGpmApprovalStatus: {
      // approvals
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    firstLevelGpmApprovalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    firstLevelGpmComment: {
      type: DataTypes.TEXT,
      allowNull:true,
    },
    secondLevelGpmApprover: {
      // approvals
      type: DataTypes.CHAR(100),
      allowNull: true,
    }, // 1  --- gfcf || gpm
    secondLevelGpmApprovalStatus: {
      // approvals
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    secondLevelGpmApprovalDate: {
      type: DataTypes.DATEONLY,
      allowNull:true,
    },
    secondLevelGpmComment: {
      type: DataTypes.TEXT,
      allowNull:true,
    },
    botDemoVideo: {
      type: DataTypes.TEXT,
      allowNull:true,
    },
    gcadApprover: {
      // approvals  //
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    gcadApprovalStatus: {
      // approvals
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    gcadApprovalDate: {
      type: DataTypes.DATEONLY,
      allowNull:true,
    },
    gcadComments: {
      // approvals
      type: DataTypes.TEXT,
      allowNull: true,
    },
    infosecApprover: {
      // approvals
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    infosecApproval: {
      // approvals
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    firstLevelControlActivity: { // first level gfcf
      type: DataTypes.BOOLEAN,
     allowNull:true 
    },
    firstLevelControlTable: {
      type: DataTypes.TEXT,
      allowNull:true,
    },
    firstLevelControlProcessArea: {
      type: DataTypes.CHAR(100),
      allowNull:true,
    },
    firstLevelControlSubProcessArea: {
      type: DataTypes.CHAR(100),
      allowNull:true,
    },
    secondLevelControlActivity: {
      type: DataTypes.BOOLEAN,
     allowNull:true 
    },
    secondLevelControlTable: {
      type: DataTypes.TEXT,
      allowNull:true,
    },
    secondLevelControlProcessArea: {
      type: DataTypes.CHAR(100),
      allowNull:true,
    },
    secondLevelControlSubProcessArea: {
      type: DataTypes.CHAR(100),
      allowNull:true,
    },
    path: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    documentLink: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    firstLevelGfcfApprovalDocumentLink: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    secondLevelGfcfApprovalDocumentLink: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    firstLevelGpmApprovalDocumentLink: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    secondLevelGpmApprovalDocumentLink: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    businessOwnerApprovalDocumentLink: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gCadApprovalDocumentLink : {
      type: DataTypes.TEXT,
      allowNull: true
    },


    sAPID: {
      type: DataTypes.CHAR(255),
      allowNull:true
    },
    UserEmail: {
      type: DataTypes.STRING,
      allowNullL:false
    },
    uATSignOffDate: {
      type: DataTypes.DATEONLY,
      allowNull:true
    },
    documentFolderName : {
      type : DataTypes.TEXT,
      allowNull : true
    },
    botType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    landscapeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    botExternalId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    masterBotID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }
);
//User.hasMany(Bot, { as: 'Bots' });
//Bot.belongsTo(User);
export default {
  Bot,
  User,
};
