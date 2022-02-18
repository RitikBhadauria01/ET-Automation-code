import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const Mailer = sequelize.define('Mailer', {
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
export default Mailer;