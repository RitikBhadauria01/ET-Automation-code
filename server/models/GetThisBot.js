import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const GetThisBot = sequelize.define('GetBot',{
    technology: {
        type: DataTypes.STRING,
    allowNull: false,
    },
    botID: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    requestedBy: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    leadPlatform: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cluster: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
})
export default {
    GetThisBot
}