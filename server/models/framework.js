import {DataTypes} from 'sequelize';
import sequelize from '../helpers/Sequalize';


const FrameWork = sequelize.define('Framework', {
    frameworkId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    docType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    docName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    docSize: {
        type: DataTypes.STRING,
        allowNull:false
    },
    docCategory: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    docUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    }
})
export default FrameWork;