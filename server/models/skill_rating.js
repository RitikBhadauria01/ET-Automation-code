import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const skillRatings = sequelize.define('skill_ratings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  softSkillID : {
    type: DataTypes.CHAR(50),
    allowNull: false,
  },
  skill_ratings : {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  review_title: {
    type: DataTypes.STRING,
  },
  review_description: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
});

export default skillRatings;
