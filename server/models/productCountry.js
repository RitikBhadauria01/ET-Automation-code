// import sequelize from "../helpers/Sequalize";
import { DataTypes, Model } from "sequelize";
import sequelize from '../helpers/Sequalize';
// import BotUser from "./BotUser";

const productCountry = sequelize.define('productCountrys', {
  
    id : {
        type: DataTypes.INTEGER,    
        primaryKey: true,
        autoIncrement: true
    },

    product_id : {
        type: DataTypes.INTEGER, 
        allowNull: true,   
    },
  
    clusterId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    country: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    
},
{
    sequelize,
    timestamps:true,
    createdAt:true,
    updatedAt: true
  }
)
module.exports = productCountry;
