// import sequelize from "../helpers/Sequalize";
import { DataTypes, Model } from "sequelize";
import sequelize from '../helpers/Sequalize';
import products from '../models/products'
// import BotUser from "./BotUser";

const productCluster = sequelize.define('productCluster', {
  
    id : {
        type: DataTypes.INTEGER,    
        primaryKey: true,
        autoIncrement: true
    },
    product_id : {
        type: DataTypes.INTEGER,
        allowNull: true,    
    },
  
    cluster: {
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
  
module.exports = productCluster;
