// assets/service/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');
const CONFIG = require('../../config/main');
const { format } = winston;

class Logger {
    constructor() {
        try {
            // 先創建日誌目錄
            fs.ensureDirSync(path.join(process.cwd(), 'logs'));
            
            // 初始化日誌系統
            this.initializeLogger();
        } catch (error) {
            console.error('Failed to initialize logger:', error);
            // 使用基礎控制台日誌作為後備
            this.logger = console;
        }
    }

    initializeLogger() {
        const logsDir = path.join(process.cwd(), 'logs');

        // 創建自定義日誌格式
        const customFormat = format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.printf(({ timestamp, level, message, category }) => {
                const categoryStr = category ? `[${category}]` : '';
                return `[${timestamp}] ${level.toUpperCase()} ${categoryStr}: ${message}`;
            })
        );

        // 配置 Winston
        this.logger = winston.createLogger({
            level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
            format: customFormat,
            transports: [
                // 錯誤日誌
                new winston.transports.File({
                    filename: path.join(logsDir, 'error.log'),
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                // 所有日誌
                new winston.transports.File({
                    filename: path.join(logsDir, 'combined.log'),
                    maxsize: 5242880,
                    maxFiles: 5
                })
            ]
        });

        // 在開發環境添加控制台輸出
        if (process.env.NODE_ENV === 'development') {
            this.logger.add(new winston.transports.Console({
                format: format.combine(
                    format.colorize(),
                    customFormat
                )
            }));
        }
    }

    // 基礎日誌方法
    log(level, message, category = null, ...args) {
        try {
            let finalMessage = typeof message === 'string' ? message : JSON.stringify(message);
            if (args.length > 0) {
                finalMessage += ' ' + args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : arg
                ).join(' ');
            }

            this.logger.log({
                level,
                message: finalMessage,
                category
            });
        } catch (error) {
            console.error('Logging failed:', error);
            console.log(`${level}: ${message}`);
        }
    }

    // 標準日誌級別
    info(message, ...args) {
        this.log('info', message, null, ...args);
    }

    error(message, ...args) {
        this.log('error', message, null, ...args);
    }

    warn(message, ...args) {
        this.log('warn', message, null, ...args);
    }

    debug(message, ...args) {
        this.log('debug', message, null, ...args);
    }

    // 分類日誌方法
    system(message, ...args) {
        this.log('info', message, 'SYSTEM', ...args);
    }

    window(message, ...args) {
        this.log('info', message, 'WINDOW', ...args);
    }

    update(message, ...args) {
        this.log('info', message, 'UPDATE', ...args);
    }

    ipc(message, ...args) {
        this.log('info', message, 'IPC', ...args);
    }

    adblock(message, ...args) {
        this.log('info', message, 'ADBLOCK', ...args);
    }

    folder(message, ...args) {
        this.log('info', message, 'FOLDER', ...args);
    }
}

// 創建並導出單例
module.exports = new Logger();