const winston = require("winston");
const path = require("path");
const fs = require("fs-extra");
const { app } = require("electron");
const CONFIG = require("./app-cfg");
const { format } = winston;

class Logger {
  constructor() {
    this.initialized = false;
    try {
      const logsDir = path.join(app.getPath("userData"), "logs");
      // 創建時間戳記格式的日誌文件名
      this.timestamp = this.getFormattedTimestamp();
      this.setupLogDirectory(logsDir);
      this.initializeLogger(logsDir);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize logger:", error);
      this.createFallbackLogger();
    }
  }

  // 新增：獲取格式化的時間戳
  getFormattedTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `[${year}-${month}-${day}_${hours}-${minutes}-${seconds}]`;
  }

  initializeLogger(logsDir) {
    const customFormat = format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.printf(({ timestamp, level, message, category }) => {
        const categoryStr = category ? `[${category}]` : "";
        return `[${timestamp}] ${level.toUpperCase()} ${categoryStr}: ${message}`;
      })
    );

    try {
      // 只使用一個時間戳命名的日誌文件
      const logFileName = `${this.timestamp}.log`;

      this.logger = winston.createLogger({
        level: process.env.NODE_ENV === "development" ? "debug" : "info",
        format: customFormat,
        transports: [
          // 單一日誌文件（包含所有級別的日誌）
          new winston.transports.File({
            filename: path.join(logsDir, logFileName),
            maxsize: 5 * 1024 * 1024 // 5MB
          })
        ]
      });

      // 在開發環境添加控制台輸出
      if (process.env.NODE_ENV === "development") {
        this.logger.add(
          new winston.transports.Console({
            format: format.combine(format.colorize(), customFormat)
          })
        );
      }

      // 記錄啟動信息
      this.system(`Logger initialized with timestamp: ${this.timestamp}`);
    } catch (error) {
      console.error("Failed to initialize winston logger:", error);
      this.createFallbackLogger();
    }
  }

  // 新增：日誌清理功能，保留最近的N個日誌文件
  async cleanOldLogs(logsDir, maxFiles = 50) {
    try {
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter((file) => file.endsWith(".log"));

      if (logFiles.length > maxFiles) {
        // 按修改時間排序
        const fileStats = await Promise.all(
          logFiles.map(async (file) => ({
            name: file,
            stat: await fs.stat(path.join(logsDir, file))
          }))
        );

        fileStats.sort((a, b) => b.stat.mtime - a.stat.mtime);

        // 刪除舊文件
        for (let i = maxFiles; i < fileStats.length; i++) {
          await fs.unlink(path.join(logsDir, fileStats[i].name));
        }

        this.system(
          `Cleaned old log files, kept ${maxFiles} most recent files`
        );
      }
    } catch (error) {
      console.error("Failed to clean old logs:", error);
    }
  }

  setupLogDirectory(logsDir) {
    try {
      fs.ensureDirSync(logsDir);

      // 清理舊日誌
      this.cleanOldLogs(logsDir);

      console.log("Log directory setup completed");
      return logsDir;
    } catch (error) {
      console.error("Failed to setup log directory:", error);
      return path.join(app.getPath("temp"), "FCheatlauncher-logs");
    }
  }

  /**
   * 創建後備的基本 logger
   */
  createFallbackLogger() {
    this.logger = winston.createLogger({
      level: "info",
      format: format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  // 確保消息是字符串
  formatMessage(message) {
    if (typeof message === "undefined") return "undefined";
    if (message === null) return "null";
    return typeof message === "string" ? message : JSON.stringify(message);
  }

  log(level, message, category = null, ...args) {
    try {
      let finalMessage = this.formatMessage(message);
      if (args.length > 0) {
        finalMessage +=
          " " + args.map((arg) => this.formatMessage(arg)).join(" ");
      }

      if (this.logger) {
        this.logger.log({
          level: level || "info",
          message: finalMessage,
          category: category || null
        });
      } else {
        console.log(`${level}: ${finalMessage}`);
      }
    } catch (error) {
      console.error("Logging failed:", error);
      console.log(`${level}: ${message}`);
    }
  }

  info(message, ...args) {
    this.log("info", message, null, ...args);
  }
  error(message, ...args) {
    this.log("error", message, null, ...args);
  }
  warn(message, ...args) {
    this.log("warn", message, null, ...args);
  }
  debug(message, ...args) {
    this.log("debug", message, null, ...args);
  }
  system(message, ...args) {
    this.log("info", message, "SYSTEM", ...args);
  }
  window(message, ...args) {
    this.log("info", message, "WINDOW", ...args);
  }
  update(message, ...args) {
    this.log("info", message, "UPDATE", ...args);
  }
  ipc(message, ...args) {
    this.log("info", message, "IPC", ...args);
  }
  adblock(message, ...args) {
    this.log("info", message, "ADBLOCK", ...args);
  }
  folder(message, ...args) {
    this.log("info", message, "FOLDER", ...args);
  }
}

// 創建並導出單例
module.exports = new Logger();
