
import Sequelize from 'sequelize';
import config from '../../config/env';

async function getConnection(req, res) {
  console.log('hered in sql connection  ');
  const sequelize = new Sequelize('bot_store_v2',config.mySqlUserName,config.mySqlPassword, {
    host: config.mySqlPvt,
    port: config.mySqlPort,
    dialect:'mysql'
  });
console.log("526pm",sequelize)
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    res.send({'connection':'successful'})
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    res.send({'connection':'failed'})
  }
}
export default {
  getConnection,
};
