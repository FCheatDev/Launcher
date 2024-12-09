const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');
const { app } = require('electron');
const CONFIG = require('../../config/app-cfg');
const { format } = winston;

class Logger {
    constructor() {
        this.initialized = false;
        try {
            // 使用 userData 路徑而不是 process.cwd()
            const logsDir = path.join(app.getPath('userData'), 'logs');
            
            // 確保日誌目錄存在並有正確權限
            this.setupLogDirectory(logsDir);
            
            // 初始化日誌系統
            this.initializeLogger(logsDir);
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize logger:', error);
            // 創建一個基本的 logger 代替 console
            this.createFallbackLogger();
        }
    }

    /**
     * 設置日誌目錄
     */
    setupLogDirectory(logsDir) {
        try {
            // 確保目錄存在
            fs.ensureDirSync(logsDir);
            
            // 在開發環境時清空日誌
            if (process.env.NODE_ENV === 'development') {
                // 只清除檔案，不刪除目錄
                const files = fs.readdirSync(logsDir);
                for (const file of files) {
                    if (file.endsWith('.log')) {
                        fs.unlinkSync(path.join(logsDir, file));
                    }
                }
            }
            
            console.log('Log directory setup completed');
        } catch (error) {
            console.error('Failed to setup log directory:', error);
            // 如果無法設置，使用臨時目錄
            return path.join(app.getPath('temp'), 'FCheatlauncher-logs');
        }
        return logsDir;
    }

    /**
     * 創建後備的基本 logger
     */
    createFallbackLogger() {
        this.logger = winston.createLogger({
            level: 'info',
            format: format.simple(),
            transports: [
                new winston.transports.Console()
            ]
        });
    }

    initializeLogger(logsDir) {
        // 創建自定義日誌格式
        const customFormat = format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.printf(({ timestamp, level, message, category }) => {
                const categoryStr = category ? `[${category}]` : '';
                return `[${timestamp}] ${level.toUpperCase()} ${categoryStr}: ${message}`;
            })
        );

        try {
            // 配置 Winston
            this.logger = winston.createLogger({
                level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
                format: customFormat,
                transports: [
                    // 錯誤日誌
                    new winston.transports.File({
                        filename: path.join(logsDir, 'error.log'),
                        level: 'error',
                        maxsize: 5 * 1024 * 1024, // 5MB
                        maxFiles: 5
                    }),
                    // 所有日誌
                    new winston.transports.File({
                        filename: path.join(logsDir, 'combined.log'),
                        maxsize: 5 * 1024 * 1024,
                        maxFiles: 5
                    }),
                    // 系統日誌
                    new winston.transports.File({
                        filename: path.join(logsDir, 'system.log'),
                        maxsize: 5 * 1024 * 1024,
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
        } catch (error) {
            console.error('Failed to initialize winston logger:', error);
            this.createFallbackLogger();
        }
    }

    // 確保消息是字符串
    formatMessage(message) {
        if (typeof message === 'undefined') return 'undefined';
        if (message === null) return 'null';
        return typeof message === 'string' ? message : JSON.stringify(message);
    }

    log(level, message, category = null, ...args) {
        try {
            let finalMessage = this.formatMessage(message);
            if (args.length > 0) {
                finalMessage += ' ' + args.map(arg => this.formatMessage(arg)).join(' ');
            }

            if (this.logger) {
                this.logger.log({
                    level: level || 'info',
                    message: finalMessage,
                    category: category || null
                });
            } else {
                console.log(`${level}: ${finalMessage}`);
            }
        } catch (error) {
            console.error('Logging failed:', error);
            console.log(`${level}: ${message}`);
        }
    }

    info(message, ...args) { this.log('info', message, null, ...args); }
    error(message, ...args) { this.log('error', message, null, ...args); }
    warn(message, ...args) { this.log('warn', message, null, ...args); }
    debug(message, ...args) { this.log('debug', message, null, ...args); }
    system(message, ...args) { this.log('info', message, 'SYSTEM', ...args); }
    window(message, ...args) { this.log('info', message, 'WINDOW', ...args); }
    update(message, ...args) { this.log('info', message, 'UPDATE', ...args); }
    ipc(message, ...args) { this.log('info', message, 'IPC', ...args); }
    adblock(message, ...args) { this.log('info', message, 'ADBLOCK', ...args); }
    folder(message, ...args) { this.log('info', message, 'FOLDER', ...args); }
}

// 創建並導出單例
module.exports = new Logger();