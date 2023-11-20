import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const ET_card = sequelize.define(
    'employee_cards',
    {
        employeeTwinID: {
            type: DataTypes.CHAR(50),
        },
        globalSkill: {
            type: DataTypes.CHAR(100),
        },
        localSkill: {
            type: DataTypes.CHAR(100),
        },
        softSkill: {
            type: DataTypes.CHAR(100),
        }, 
        businessRequest: {
            type: DataTypes.CHAR(50)
        },
        status:{
            type: DataTypes.BOOLEAN,
        }
       
    },
    {
        sequelize,
        timestamps:true,
        createdAt:true,
        updatedAt: true,
        deletedAt:true
      }
);

export default {
    ET_card
}

