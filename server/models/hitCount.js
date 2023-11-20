import { DataTypes } from "sequelize";
import sequelize from '../helpers/Sequalize';

const hitCounts = sequelize.define (
    "hitcount", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
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
export default hitCounts;
