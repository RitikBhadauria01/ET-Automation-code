import { DataTypes, Model } from "sequelize";
import sequelize from '../helpers/Sequalize';

const business_unit_filter = sequelize.define('business_unit_filter', {
  
    business_unit_id: {
        type: DataTypes.INTEGER,    
        primaryKey: true,
        autoIncrement: true
    },
    cluster: {
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
module.exports = business_unit_filter
