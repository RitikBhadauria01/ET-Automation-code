import winston from 'winston';

const config = {
  levels: { error: 0, debug: 1, warn: 2, data: 3, info: 4, verbose: 5, silly: 6, custom: 7 },
  colors: {
    info: 'green',
    error: 'red',
    warn: 'yellow',
    debug: 'blue',
    data: 'grey',
    verbose: 'cyan',
    silly: 'magenta',
    custom: 'black',
  },
};

winston.addColors(config.colors);

const logger = winston.createLogger({
  levels: config.levels,
  format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  transports: [new winston.transports.Console()],
  level: 'custom',
});

export default logger;
