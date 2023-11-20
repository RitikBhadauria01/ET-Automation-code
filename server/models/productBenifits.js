import { DataTypes, Model } from "sequelize";
import sequelize from '../helpers/Sequalize';

const productBenifits = sequelize.define('product_benefits', {
  
    benefit_id: {
        type: DataTypes.INTEGER,    
        primaryKey: true,
        autoIncrement: true
    },
    benefit: {
        type: DataTypes.CHAR(300),
        allowNull: true,
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    benefit_icon: {
        type: DataTypes.CHAR(300),
        allowNull: true,
    },
    benefit_status: {
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
  )
module.exports = productBenifits;
