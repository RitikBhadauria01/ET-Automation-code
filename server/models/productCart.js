import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const Product_cart = sequelize.define(
    'employee_products',
    {
        product_id : {
            type: DataTypes.CHAR(100),
        },
/*        product_name: {
            type: DataTypes.CHAR(100),
        },
        businessrequest: {
            type: DataTypes.CHAR(100),
        },
        cluster: {
            type: DataTypes.CHAR(50),
        }, 
        area: {
            type: DataTypes.CHAR(50),   
        },
        subarea: {
            type: DataTypes.CHAR(100),
        },*/
      
    },
    {
        sequelize,
        timestamps:true,
        createdAt:true,
        updatedAt: true,
        // deletedAt:true
      }
);

export default {
    Product_cart
}
