"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
const winston_1 = __importDefault(require("winston"));
function createLogger(module) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const formats = [
        winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston_1.default.format.errors({ stack: true }),
        winston_1.default.format.json()
    ];
    if (isDevelopment) {
        formats.push(winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            const stackStr = stack ? `\n${stack}` : '';
            return `${timestamp} [${level}] ${module}: ${message}${stackStr}${metaStr ? `\n${metaStr}` : ''}`;
        }));
    }
    const transports = [
        new winston_1.default.transports.Console()
    ];
    // Add file transport in production
    if (!isDevelopment) {
        transports.push(new winston_1.default.transports.File({
            filename: 'logs/odin-error.log',
            level: 'error',
            maxsize: 50 * 1024 * 1024, // 50MB
            maxFiles: 5
        }), new winston_1.default.transports.File({
            filename: 'logs/odin-combined.log',
            maxsize: 50 * 1024 * 1024, // 50MB
            maxFiles: 5
        }));
    }
    return winston_1.default.createLogger({
        level: logLevel,
        format: winston_1.default.format.combine(...formats),
        transports,
        exitOnError: false
    });
}
exports.logger = createLogger('Odin');
//# sourceMappingURL=logger.js.map