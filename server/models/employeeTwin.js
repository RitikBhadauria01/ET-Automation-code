import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const employeeTwin = sequelize.define(
    'employeeTwins',
    {
        newRequest: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        employeeTwinID: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        employeeTwinName: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        employeeTwinDescription: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        uploadPhoto: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.CHAR(50),
            allowNull: false,
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
        geoItPartner: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        country: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        businessOwner: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        engagementLead: {
            type: DataTypes.CHAR(100),
            allowNull: false,
        },
        globalSkill: {
            type: DataTypes.CHAR(100),
            allowNull: false,
        },
        localSkill: {
            type: DataTypes.CHAR(100),
            allowNull: false,
        },
        softSkill: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        uploadDocument: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        manualhour:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        fte:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        businessRequest: {
            type: DataTypes.CHAR(100),
            allowNull: false,
        },
        businessgroup: {
            type: DataTypes.CHAR(100),
            allowNull: false,
        },   
         businessunit: {
            type: DataTypes.CHAR(100),
            allowNull: false,
        },  
          businessoption: {
            type: DataTypes.CHAR(100),
            allowNull: false,
        },
        goLiveDate: {
            //bot delivery filedss
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
       product_id: {
            // supporting documnet section
            type: DataTypes.TEXT,
            allowNull: true,
          },
       sopDocument: {
            // supporting documnet section
            type: DataTypes.TEXT,
            allowNull: false,
          },
          pddDocument: {
            // supporting documnet section
            type: DataTypes.TEXT,
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
          transactions: {
            type: DataTypes.TEXT,
            allowNull: false,
          },
          reporting: {
              type: DataTypes.TEXT,
              allowNull: false,
          },
          cognitive: {
            type: DataTypes.TEXT,
            allowNull: false,
          },
          decisionautomations: {
              type: DataTypes.TEXT,
              allowNull: false,
          },
genAi: {
     type: DataTypes.TEXT,
      allowNull: false,
    },
    }
);
export default {
    employeeTwin
};


