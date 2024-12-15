const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');
const CONFIG = require('./app-cfg');
const logger = require('./logger');

class FolderManager {
    constructor() {
        this.initialized = false;
        this.logsPath = path.join(app.getPath('userData'), 'logs');
        this.gamesPath = path.join(app.getPath('userData'), 'Games');
        this.gameSubFolders = ['Roblox', 'GenshinImpact', 'Minecraft'];
    }

    /**
     * 初始化所有必需的文件夾
     */
    async initialize() {
        try {
            logger.folder('Starting folders initialization');
            
            // 創建日誌目錄
            await fs.ensureDir(this.logsPath);
            logger.folder('Logs directory created/verified');
            
            // 創建遊戲目錄
            await this._createGameDirectories();
            
            this.initialized = true;
            logger.folder('Folders initialization completed');
        } catch (error) {
            logger.error('Failed to initialize folders:', error);
            throw error;
        }
    }

    /**
     * 創建遊戲相關目錄
     */
    async _createGameDirectories() {
        try {
            // 創建主遊戲目錄
            await fs.ensureDir(this.gamesPath);
            logger.folder('Main games directory created/verified');

            // 創建子目錄
            for (const subFolder of this.gameSubFolders) {
                const subPath = path.join(this.gamesPath, subFolder);
                await fs.ensureDir(subPath);
                logger.folder(`Game subdirectory created/verified: ${subFolder}`);
            }
        } catch (error) {
            logger.error('Failed to create game directories:', error);
            throw error;
        }
    }

    /**
     * 驗證所有必需的目錄
     */
    async validateDirectories() {
        const issues = [];
        
        try {
            // 只檢查日誌和遊戲目錄
            const requiredDirs = [
                this.logsPath,
                this.gamesPath
            ];

            for (const dir of requiredDirs) {
                const exists = await fs.pathExists(dir);
                if (!exists) {
                    issues.push(`Missing directory: ${dir}`);
                }
            }

            // 檢查遊戲子目錄
            for (const subFolder of this.gameSubFolders) {
                const subPath = path.join(this.gamesPath, subFolder);
                const exists = await fs.pathExists(subPath);
                if (!exists) {
                    issues.push(`Missing game subdirectory: ${subPath}`);
                }
            }

            return {
                valid: issues.length === 0,
                issues
            };
        } catch (error) {
            logger.error('Directory validation failed:', error);
            throw error;
        }
    }

    /**
     * 清理並重新創建所有目錄
     */
    async recreateDirectories() {
        try {
            logger.folder('Starting directory recreation');
            
            // 只刪除遊戲和日誌目錄
            await fs.remove(this.gamesPath);
            await fs.remove(this.logsPath);
            
            // 重新創建必要目錄
            await this.initialize();
            
            logger.folder('Directories recreated successfully');
        } catch (error) {
            logger.error('Failed to recreate directories:', error);
            throw error;
        }
    }
}

// 導出單例
module.exports = new FolderManager();