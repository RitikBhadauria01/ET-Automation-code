import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const et_user = sequelize.define(
    'et_user',
    {
        ETid: {
            type: DataTypes.STRING,
        },
        name: {
            type: DataTypes.STRING,
        },
        email: {
            type: DataTypes.STRING,
        },
        usagedata: {
            type: DataTypes.STRING,
        },
        addedBy: {
            type: DataTypes.STRING,
        }
    }
);

export default et_user;

