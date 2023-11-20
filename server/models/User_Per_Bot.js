import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const userPerBot = sequelize.define(
    'user_per_bot',
    {
        ETID: {
            type: DataTypes.STRING,
        },
        Year: {
            type: DataTypes.STRING,
        },
        Month: {
            type: DataTypes.STRING,
        },
        NoOfUsers: {
            type: DataTypes.STRING,
        },
    }
);

export default userPerBot;

