
import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const averRating = sequelize.define('averageRatingTable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  roundedAverageRating: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  catalog_products:{
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

export default averRating;


