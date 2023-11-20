import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const softSkill = sequelize.define(
    'soft_skill',
    {
        employeeTwinID: {
            type: DataTypes.CHAR(50),
            allowNull: true,
        },
        softSkillID: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        skillName: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        skillDescription: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        Profile: {
            type: DataTypes.CHAR(200),
            allowNull: false,
        },
        engagementLeadEmail: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        businessRequestorEmail: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        uploadDocument: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        category: {
            type: DataTypes.CHAR(200),
            allowNull: false,
        },
    }
);
export default softSkill;

