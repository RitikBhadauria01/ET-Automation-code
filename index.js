import 'core-js/stable';
import 'regenerator-runtime/runtime';

//import mongoose from 'mongoose';
import config from './config/env';
import logger from './config/winston';
import app from './config/express';

// listen on port config.port
app.listen(process.env.PORT || config.port, () => {
  logger.log({
    level: 'info',
    message: `Server Started On Port ${config.port} (${config.env})`,
    fileName: 'index.js',
  });
});

export default app;
