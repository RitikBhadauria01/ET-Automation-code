import { DataTypes, Model } from 'sequelize';
import sequelize from '../helpers/Sequalize';

class RoiFormData extends Model {}
RoiFormData.init(
  {
    clusterProcess: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expectedMcoType: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expectedCountry: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    leadPlatformProcess: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expectedArea: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expectedSubArea: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    opportunityName: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    opportunityDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    technology: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    botId: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    manualHours: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    annualExecutedProcess: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    resourceProcess: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    errorRateProcess: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    costAvoidance: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    impactOfOKR: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    developmentCost: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    runCostProcess: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    resRoiMonthsBreakdown: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    resRoiFor1Year: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    resRoiFor3Year: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    roiMonthsBreakdown: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    roiFor1Year: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    roiFor3Year: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    formSubmittedBy: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    modelName: 'RoiFormData',
  }
);
export default RoiFormData;

