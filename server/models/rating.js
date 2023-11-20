import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';
import products from '../models/products';

const Ratings = sequelize.define('ratings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id : {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ratings : {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
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


export default Ratings;
