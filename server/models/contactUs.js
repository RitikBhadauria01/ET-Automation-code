import sequelize from '../helpers/Sequalize';
import { DataTypes, Model } from 'sequelize';
import BotUser from './BotUser'
class ContactUs extends Model {}
// initalize
ContactUs.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    enquiryMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    enquiryProductType: {
      type: DataTypes.CHAR(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps:true,
    createdAt:true,
    updatedAt: true,
    modelName: 'contactUs',
  }
);
BotUser.User.hasMany(ContactUs, {
  allowNull:false
});
ContactUs.belongsTo(BotUser.User);
export default ContactUs;
