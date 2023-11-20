import { DataTypes, Model } from "sequelize";
import sequelize from '../helpers/Sequalize';

const FunctionFilters = sequelize.define('function_filter', {
  
    function_id: {
        type: DataTypes.INTEGER,    
        primaryKey: true,
        autoIncrement: true
    },
    function_name: {
        type: DataTypes.CHAR(300),
        allowNull: true,
    }
},
{
    sequelize,
    timestamps:true,
    createdAt:true,
    updatedAt: true,
    deletedAt:true
  }
  )
module.exports = FunctionFilters
