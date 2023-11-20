import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const shares = sequelize.define('shareTable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
 product_id: {
  type: DataTypes.INTEGER,
 },
 message: {
  type: DataTypes.STRING,
 },
 shareEmail: {
  type: DataTypes.STRING
 },
  createdAt: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  updatedAt: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
});
export default shares;

