import { DataTypes } from "sequelize";
import sequelize from '../helpers/Sequalize';

const pollQuestion = sequelize.define (
    "pollsques", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        questions : {
            type: DataTypes.TEXT,
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
export default pollQuestion;
