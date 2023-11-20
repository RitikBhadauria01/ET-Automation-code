import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const ET_order = sequelize.define(
    'employee_orders',
    {
        globalSkill: {
            type: DataTypes.TEXT,
           // allowNull: false,
        },
        localSkill: {
            type: DataTypes.TEXT,
            //allowNull: false,
        },
        softSkill: {
            type: DataTypes.TEXT,
            //allowNull: false,
        },
        orderID: {
            type: DataTypes.CHAR(50),
            //allowNull: false,
        },
//        estimatedDeliveryDateLocal: {
  //          type: DataTypes.CHAR(100),
    //        allowNull: false,
      //  },
//        estimatedDeliveryDateGlobal: {
  //          type: DataTypes.CHAR(100),
    //        allowNull: false,
      //  },
        goLiveDate: {
            type: DataTypes.CHAR(100),
            //allowNull: true,
        },
        businessRequest: {
            type: DataTypes.CHAR(50),
           
        },
        product_id : {
            type: DataTypes.TEXT,
        },
               GlobalSkill_ProcessName: {
            type: DataTypes.TEXT,   
        },
        localSkill_ProcessName: {
            type: DataTypes.TEXT,   
        },
        softSkill_ProcessName: {
            type: DataTypes.TEXT,   
        },
        productSkill_ProcessName: {
            type: DataTypes.TEXT,   
        },
        ETname:{
            type: DataTypes.TEXT,
            allowNull: true, 
        },
        Etprofile: {
            type: DataTypes.STRING,
            allowNull: true,
          },     
    },
    {
        sequelize,
        timestamps:true,
        createdAt:true,
        updatedAt: true,
        deletedAt:true
      }
);

export default {
    ET_order
}
