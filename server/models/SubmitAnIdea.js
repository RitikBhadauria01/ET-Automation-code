import { DataTypes, Model } from 'sequelize';
import sequelize from '../helpers/Sequalize';

class SubmitAnIdea extends Model{
}
SubmitAnIdea.init(
    {
        processToBeAutomated: {
            type: DataTypes.STRING,
            allowNull:true
        },
        applicationInvolved: {
            type: DataTypes.STRING,
            allowNull:true
        },
        describeTheProcess: {
            type: DataTypes.TEXT,
            allowNull:true
        },
        expectedBenfit: {
            type: DataTypes.TEXT,
            allowNull:true
        },
        ideaSubmittedBy: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ideaProposedByMail: {
            type: DataTypes.STRING,
            allowNull: false,
        },
	expectedRequestType: {
            type: DataTypes.TEXT,
            allowNull:true
        },
        expectedProcessBotID: {
            type: DataTypes.TEXT,
            allowNull:true
        },
        expectedCluster: {
            type: DataTypes.TEXT,
            allowNull:true
        },
	expectedMcoType: {
            type: DataTypes.TEXT,
            allowNull:true
        },
        expectedLeadPlatform: {
            type: DataTypes.TEXT,
            allowNull:true
        },
        expectedAreaType: {
            type: DataTypes.TEXT,
            allowNull:true
        },
        expectedRequestorEmail: {
            type: DataTypes.TEXT,
            allowNull:true
        },
	expectedDocUpdated: {
            type: DataTypes.TEXT,
            allowNull:true
        },
        expectedPDDdocument: {
            type: DataTypes.TEXT,
            allowNull:true
        }

    },
    {
        sequelize,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        modelName: 'SubmitAnIdea',
      }
)
export default SubmitAnIdea;
