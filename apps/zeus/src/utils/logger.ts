import winston from 'winston';

export function createLogger(module: string): winston.Logger {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const formats = [
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ];

    if (isDevelopment) {
        formats.push(
            winston.format.colorize({ all: true }),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                const stackStr = stack ? `\n${stack}` : '';
                return `${timestamp} [${level}] ${module}: ${message}${stackStr}${metaStr ? `\n${metaStr}` : ''}`;
            })
        );
    }

    const transports: winston.transport[] = [
        new winston.transports.Console()
    ];

    // Add file transport in production
    if (!isDevelopment) {
        transports.push(
            new winston.transports.File({
                filename: 'logs/odin-error.log',
                level: 'error',
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 5
            }),
            new winston.transports.File({
                filename: 'logs/odin-combined.log',
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 5
            })
        );
    }

    return winston.createLogger({
        level: logLevel,
        format: winston.format.combine(...formats),
        transports,
        exitOnError: false
    });
}

export const logger = createLogger('Odin');