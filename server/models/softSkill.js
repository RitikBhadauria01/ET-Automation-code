import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const softSkill = sequelize.define(
    'soft_skill',
    {
        employeeTwinID: {
            type: DataTypes.CHAR(50),
            allowNull: true,
        },
        softSkillID: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        skillName: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        skillDescription: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        Profile: {
            type: DataTypes.CHAR(200),
            allowNull: false,
        },
        engagementLeadEmail: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        businessRequestorEmail: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        uploadDocument: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        category: {
            type: DataTypes.CHAR(200),
            allowNull: false,
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
          price: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          costType: {
            type: DataTypes.CHAR(50),
            allowNull: true,
          },
 
    }
);
export default softSkill;

