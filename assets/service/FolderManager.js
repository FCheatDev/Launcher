const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');
const CONFIG = require('../../config/app-cfg');
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
            
            // 確保基本目錄存在
            await this._ensureBaseDirectories();
            
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
     * 確保基本目錄存在
     */
    async _ensureBaseDirectories() {
        try {
            // 確保配置目錄
            await fs.ensureDir(CONFIG.FOLDERS.CONFIG);
            logger.folder('Config directory created/verified');

            // 確保日誌目錄在固定位置
            await fs.ensureDir(this.logsPath);
            logger.folder('Logs directory created/verified');

            // 確保更新目錄
            await fs.ensureDir(CONFIG.PATHS.UPDATES);
            logger.folder('Updates directory created/verified');

        } catch (error) {
            logger.error('Failed to create base directories:', error);
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
            // 檢查基本目錄
            const baseDirectories = [
                CONFIG.FOLDERS.CONFIG,
                this.logsPath,
                CONFIG.PATHS.UPDATES
            ];

            for (const dir of baseDirectories) {
                const exists = await fs.pathExists(dir);
                if (!exists) {
                    issues.push(`Missing directory: ${dir}`);
                }
            }

            // 檢查遊戲目錄
            const gameMainExists = await fs.pathExists(this.gamesPath);
            if (!gameMainExists) {
                issues.push(`Missing main games directory: ${this.gamesPath}`);
            }

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
            
            // 刪除所有現有目錄
            await fs.remove(CONFIG.APP.ROOT_PATH);
            
            // 重新創建所有目錄
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