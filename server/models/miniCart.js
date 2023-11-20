import { DataTypes } from 'sequelize';

import sequelize from '../helpers/Sequalize';

const miniCart = sequelize.define('miniCart', {
    userName: {
      type: DataTypes.STRING,
      allowNull: true,  
    },
    skillID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    skillName: {
      type: DataTypes.STRING,
      allowNull: true,
      //primaryKey: true,
    },
    skillDescription: {
        type: DataTypes.STRING,
        allowNull: true,
        //primaryKey: true,
      },
    price:{
        type:DataTypes.NUMBER,
        allowNull:true
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

  export default miniCart;


