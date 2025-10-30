import winston from 'winston';

export const createLogger = (module: string): winston.Logger => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, module: mod, ...meta }) => {
        return `${timestamp} [${level.toUpperCase()}] [${mod || module}] ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`;
      })
    ),
    defaultMeta: { module },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({ 
        filename: process.env.LOG_FILE || 'colosseum.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ]
  });
};

export const logger = createLogger('Colosseum');