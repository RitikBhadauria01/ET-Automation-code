import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const EmployeeTwinFed = sequelize.define('EmployeeTwinFeds', {
    description: {
        type: DataTypes.STRING,
        allowNull:true
    },
    rating: {
        type: DataTypes.STRING,
        allowNull:true
    },
    
}
  )
export default EmployeeTwinFed;


