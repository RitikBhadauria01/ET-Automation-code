import { DataTypes } from "sequelize";
import sequelize from '../helpers/Sequalize';

const likes = sequelize.define (
    "like", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        postId: {
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
export default likes;
