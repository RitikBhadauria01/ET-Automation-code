import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const deleteCostUser = sequelize.define(
    'deleteCostUser',
    {
        botID: {
            type: DataTypes.STRING,
        },
        ETID: {
            type: DataTypes.STRING,
        },
        Month: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.STRING,
        },
    }
);

export default deleteCostUser;
