import { DataTypes } from "sequelize";
import sequelize from '../helpers/Sequalize';

const Comments = sequelize.define(
    'commentsTable',{
      email : {
        type: DataTypes.STRING,
            allowNull: false,
      },
        userComments: {
            type: DataTypes.STRING,
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

});

export default Comments;
