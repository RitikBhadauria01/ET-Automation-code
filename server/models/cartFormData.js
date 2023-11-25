import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const cartFormData = sequelize.define(
    'cartFormData',
    {
        userName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ET_name:{
            type: DataTypes.STRING,
            allowNull: true
        },
        function:{
            type: DataTypes.STRING,
            allowNull: true
        },
        region:{
            type: DataTypes.STRING,
            allowNull: true
        },
        descriptions:{
            type: DataTypes.STRING,
            allowNull: true
        },
        ET_logo:{
            type: DataTypes.STRING,
            allowNull: true
        },
        Business_owner:{
            type: DataTypes.STRING,
            allowNull: true
        },
        Country_code:{
            type: DataTypes.STRING,
            allowNull: true
        },
        GL_Account:{
            type: DataTypes.STRING,
            allowNull: true
        },
        Cost_centre_owner:{
            type: DataTypes.STRING,
            allowNull: true
        },
        To_country_code:{
            type: DataTypes.STRING,
            allowNull: true
        },
        To_cost_centre:{
            type: DataTypes.STRING,
            allowNull: true
        },
        commentText: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        commentType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        orderID :{
            type: DataTypes.STRING,
            allowNull: true,
        },
        orderStatus :{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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

export default cartFormData;

