import { DataTypes } from 'sequelize';

import sequelize from '../helpers/Sequalize';

const newUserUnilever = sequelize.define('AllnewUserUnilevers', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      //primaryKey: true,
    },
    createdAt: {
        type: DataTypes.DATEONLY,

        allowNull: false,
      },

      updatedAt: {
        type: DataTypes.DATEONLY,

        allowNull: false,
      },

  });

  export default newUserUnilever;


