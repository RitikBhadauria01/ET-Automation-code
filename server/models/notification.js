
import { DataTypes } from 'sequelize';

import sequelize from '../helpers/Sequalize';

const Notification = sequelize.define('notifications', {
  id: {
    type: DataTypes.INTEGER,

    primaryKey: true,

    autoIncrement: true,
  },

  product_id: {
    type: DataTypes.INTEGER,
  },

  pinnedByUsername: {
    type: DataTypes.STRING,
  },

  pinnedById: {
    type: DataTypes.STRING,
  },

  targetEmails: {
    type: DataTypes.TEXT,
  },

  targetUsername: {
    type: DataTypes.STRING,
  },
  message: {
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

export default Notification;


