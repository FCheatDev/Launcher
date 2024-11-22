// services/Logger.js

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
    constructor() {
        this.logDir = path.join(app.getPath('userData'), 'logs');
        this.currentLogFile = null;
        this.stream = null;
        this.initialize();
    }

    initialize() {
        try {
            // 建立日誌目錄
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }

            // 設定當前日誌檔案名稱
            const date = new Date().toISOString().split('T')[0];
            this.currentLogFile = path.join(this.logDir, `${date}.log`);

            // 建立寫入流
            this.stream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
            
            // 記錄啟動信息
            this.info('Logger initialized');
            this.info(`Log directory: ${this.logDir}`);
        } catch (error) {
            console.error('Failed to initialize logger:', error);
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level}] ${message}`;
        
        if (data) {
            if (typeof data === 'object') {
                logMessage += '\n' + JSON.stringify(data, null, 2);
            } else {
                logMessage += ' ' + data;
            }
        }
        
        return logMessage + '\n';
    }

    // 一般信息日誌
    info(message, data = null) {
        const logMessage = this.formatMessage('INFO', message, data);
        console.log(logMessage.trim());
        this.write(logMessage);
    }

    // 警告日誌
    warn(message, data = null) {
        const logMessage = this.formatMessage('WARN', message, data);
        console.warn(logMessage.trim());
        this.write(logMessage);
    }

    // 錯誤日誌
    error(message, data = null) {
        const logMessage = this.formatMessage('ERROR', message, data);
        console.error(logMessage.trim());
        this.write(logMessage);
    }

    // 調試日誌
    debug(message, data = null) {
        const logMessage = this.formatMessage('DEBUG', message, data);
        console.debug(logMessage.trim());
        this.write(logMessage);
    }

    // 系統日誌
    system(message, data = null) {
        const logMessage = this.formatMessage('SYSTEM', message, data);
        console.log(logMessage.trim());
        this.write(logMessage);
    }

    write(message) {
        if (this.stream) {
            this.stream.write(message);
        }
    }

    // 清理舊日誌檔案（保留最近30天的日誌）
    async cleanOldLogs() {
        try {
            const files = await fs.promises.readdir(this.logDir);
            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stats = await fs.promises.stat(filePath);
                
                if (stats.birthtime.getTime() < thirtyDaysAgo) {
                    await fs.promises.unlink(filePath);
                    this.info(`Deleted old log file: ${file}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning old logs:', error);
        }
    }

    // 獲取所有日誌檔案
    async getLogFiles() {
        try {
            const files = await fs.promises.readdir(this.logDir);
            return files.filter(file => file.endsWith('.log'))
                       .map(file => path.join(this.logDir, file));
        } catch (error) {
            console.error('Error getting log files:', error);
            return [];
        }
    }

    // 獲取特定日期的日誌內容
    async getLogContent(date) {
        const logFile = path.join(this.logDir, `${date}.log`);
        try {
            if (fs.existsSync(logFile)) {
                return await fs.promises.readFile(logFile, 'utf8');
            }
            return null;
        } catch (error) {
            console.error('Error reading log file:', error);
            return null;
        }
    }

    // 關閉日誌
    cleanup() {
        if (this.stream) {
            this.info('Logger shutting down');
            this.stream.end();
            this.stream = null;
        }
    }
}

module.exports = new Logger();