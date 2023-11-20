import { DataTypes } from "sequelize";
import sequelize from '../helpers/Sequalize';

const Pin = sequelize.define (
    "pin", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
        createdAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            
          },
          updatedAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            
          }

    }
)
export default Pin;
