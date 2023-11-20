import { DataTypes } from 'sequelize';

import sequelize from '../helpers/Sequalize';

const BuyNow = sequelize.define('BuyNows', {
  id: {
    type: DataTypes.INTEGER,

    primaryKey: true,

    autoIncrement: true,
  },

  product_id: {
    type: DataTypes.INTEGER,

    allowNull: false,
  },

  product_type: {
    type: DataTypes.STRING,

    allowNull: true,
  },

  product_title: {
    type: DataTypes.STRING,

    allowNull: true,
  },

  price: {
    type: DataTypes.INTEGER,

    allowNull: false,
  },

  oneTime: {
    type: DataTypes.INTEGER,

    allowNull: false,
  },

  oneTimeDiscounted: {
    type: DataTypes.INTEGER,
  },

  yearOnYear: {
    type: DataTypes.INTEGER,
  },

  yearOnYearDiscounted: {
    type: DataTypes.INTEGER,
  },

  list: {
    type: DataTypes.STRING,

    allowNull: true,
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

export default BuyNow;

