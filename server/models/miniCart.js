import { DataTypes } from 'sequelize';

import sequelize from '../helpers/Sequalize';

const miniCart = sequelize.define('miniCart', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
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
        type:DataTypes.FLOAT,
        allowNull:true
    },
    orderID:{
      type:DataTypes.STRING,
      allowNull: true,
    },
    status:{
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt:{
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    updatedAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    }
  });

  export default miniCart;


