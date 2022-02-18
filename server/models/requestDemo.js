import { DataTypes, Model } from 'sequelize';
import sequelize from '../helpers/Sequalize';
import BotUser from './BotUser';
class RequestDemo extends Model {}
RequestDemo.init(
  {
    technology: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    leadPlatform: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cluster: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    modelName: 'RequestDemo',
  }
);
BotUser.User.hasMany(RequestDemo, {
  allowNull: false,
});
RequestDemo.belongsTo(BotUser.User);
export default RequestDemo;
