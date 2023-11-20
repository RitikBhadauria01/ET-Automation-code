import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const ET_manage = sequelize.define(
    'employee_manages',
    {
        Empid: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        Year: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        Cost: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        Month: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        Skill: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        usercount: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Averagetime: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Skilltype: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        interactions: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        Hits: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Username: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
       
      
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
    ET_manage
}
