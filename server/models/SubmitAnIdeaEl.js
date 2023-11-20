import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const Submitanideael = sequelize.define('submitanideaels', {
    leadPlatform: {
        type: DataTypes.STRING,
        allowNull:true
    },
    cluster: {
        type: DataTypes.STRING,
        allowNull:true
    },
    el: {
        type: DataTypes.STRING,
        allowNull:true
    }
})
export default Submitanideael;

