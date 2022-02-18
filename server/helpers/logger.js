import { createLogger, transports, format } from 'winston';

const logger = new createLogger({
  format: format.combine(format.timestamp({ format: 'DD-MM-YYYY HH:MM:SS' }), format.json()),
  transports: [
    new transports.File({
      level: 'debug',
      filename: '../PWA_App_Logs/logs.log',
      bufferLogSize: 1,
      syncTimeout: 0,
      rotatePeriod: 'YYYY-MM-DD',
      eol: '\n',
    }),
    new transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: true,
      colorize: true,
    }),
  ],
  exitOnError: false,
});

logger.stream = {
  write: function(message, encoding) {
    logger.info(JSON.parse(message));
  },
};

export default logger;