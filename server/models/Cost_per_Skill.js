import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const costPerSkill = sequelize.define(
    'cost_per_skill',
    {
        BotId: {
            type: DataTypes.STRING,
        },
        ETID: {
            type: DataTypes.STRING,
        },
        SkillName: {
            type: DataTypes.STRING,
        },
        RunHours: {
            type: DataTypes.STRING,
        },
        RunCost: {
            type: DataTypes.STRING,
        },
        NoOfHits: {
            type: DataTypes.STRING,
        },
        NoOfUsers: {
            type: DataTypes.STRING,
        },
        Year: {
            type: DataTypes.STRING,
        },
        Month: {
            type: DataTypes.STRING,
        },
        RunCostPerHit_Hour : {
            type: DataTypes.STRING,
        }
        

    }
);

export default costPerSkill;

