import { DataTypes, Model } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const GfcfTable = sequelize.define('Gfcf', {
  process: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  subProcess: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  risk: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  riskDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  control: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  controlName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  controlDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  assertions: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  controlType: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  controlAutomationLevel: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  controlFequency: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  keyOrNonKey: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  controlOperator: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  accountability: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  controlEvidenceLocation: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  monitered: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  controlHealthIndicator: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  mitigateSodRisk: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
});
export default GfcfTable;