import { DataTypes, Model } from 'sequelize';
import sequelize from '../helpers/Sequalize';
import BotUser from './BotUser';
class Demand extends Model {}
// initalize
Demand.init(
  {
    rowKey: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement:true
    },
    timestamp: {
      type:DataTypes.DATE,
      allowNull: false,
      defaultValue:DataTypes.NOW
    },
    subArea: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cluster: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    commentsFromStakeHolder: {
      type: DataTypes.TEXT,
      allowNull:true
    },
    convertedDemand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currentStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    product: { // ddirector is change to product
      type: DataTypes.STRING,
      allowNull: false,
    },
    productOwner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mcoLeadPlatform: {
      type: DataTypes.STRING,
      allowNull:true,
    },
    sessionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    el: {
      type: DataTypes.STRING,
      allowNull: false
    },
    targetPitch: {
      type: DataTypes.STRING,
      allowNull: false,
    }, 
  },
  {
    sequelize,
    modelName: 'Demand',
    timestamps: false,
  }
);
export default Demand;
