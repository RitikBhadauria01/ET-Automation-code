// import sequelize from "../helpers/Sequalize";
import { DataTypes, Model } from "sequelize";
import sequelize from '../helpers/Sequalize';
// import BotUser from "./BotUser";

const productProcess = sequelize.define('product_process', {
  
    process_id  : {
        type: DataTypes.INTEGER,    
        primaryKey: true,
        autoIncrement: true
    },
    process_head: {
        type: DataTypes.CHAR(300),
        allowNull: true,
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    process_text: {
        type: DataTypes.CHAR(300),
        allowNull: true,
    },
    process_status: {
        type: DataTypes.CHAR(300),
        allowNull: true,
    }
},
// {
//     sequelize,
//     timestamps:true,
//     createdAt:true,
//     updatedAt: true
//   }
{
    freezeTableName:true
}
  )
module.exports = productProcess;
