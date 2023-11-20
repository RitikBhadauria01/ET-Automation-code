import { DataTypes } from "sequelize";
import sequelize from '../helpers/Sequalize';

const pollAnswer = sequelize.define (
    "pollanswers", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        label :{
            type: DataTypes.TEXT,
            allowNull: false
        },
        value : {
            type: DataTypes.TEXT,
            allowNull: false
        },
        QuestionId:{
            type: DataTypes.INTEGER,
            allowNull: false
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
export default pollAnswer;
