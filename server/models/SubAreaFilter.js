import { DataTypes, Model } from "sequelize";
import sequelize from '../helpers/Sequalize';

const SubAreaFilters = sequelize.define('sub_area_filter', {
  
    sub_area_id: {
        type: DataTypes.INTEGER,    
        primaryKey: true,
        autoIncrement: true
    },
    sub_area: {
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
module.exports = SubAreaFilters
