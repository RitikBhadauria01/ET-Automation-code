import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const ET_cart = sequelize.define(
    'employee_carts',
    {
        globalSkill: {
            type: DataTypes.TEXT,
           
        },
        localSkill: {
            type: DataTypes.TEXT,
          
        },
        softSkill: {
            type: DataTypes.TEXT,
        }, 
        businessRequest: {
            type: DataTypes.CHAR(50),
           
        },
        product_id : {
            type: DataTypes.TEXT,
        },
        status:{
            type: DataTypes.BOOLEAN,
        }
       
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
    ET_cart
}
