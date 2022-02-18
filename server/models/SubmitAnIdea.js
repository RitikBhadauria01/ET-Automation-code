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