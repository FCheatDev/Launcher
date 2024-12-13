// assets/service/GameManager.js
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const CONFIG = require('./app-cfg');
const logger = require('./logger');
const { execFile } = require('child_process');

class GameManager {
    constructor() {
        this.executorConfigs = CONFIG.EXECUTORS;
        this.urlCache = new Map();
        this.URL_CACHE_DURATION = 60 * 60 * 1000;
    }

    /**
     * 檢查執行器是否已安裝
     */
    checkGameInstalled(gameId) {
        try {
            const config = this.executorConfigs[gameId.toUpperCase()];
            if (!config) {
                throw new Error('無效的執行器');
            }
    
            logger.system(`Checking for ${config.name}...`);
            const exists = fs.pathExistsSync(config.exePath);
            logger.system(`${config.name} ${exists ? 'found' : 'not found'} at ${config.exePath}`);
            return {
                exists,
                path: exists ? config.exePath : null
            };
        } catch (error) {
            logger.error(`Error checking executor: ${gameId}`, error);
            throw error; // 直接拋出錯誤
        }
    }
    /**
     * 針對 Solara 的特殊處理
     */
    async getSolaraUrl() {
        try {
            // 首先嘗試直接訪問當前的下載 URL
            const currentUrl = 'https://4d38a1ec.solaraweb-alj.pages.dev/download/static/files/Bootstrapper.exe';
            try {
                const response = await axios.head(currentUrl);
                if (response.status === 200) {
                    return currentUrl;
                }
            } catch (error) {
                logger.system('Current Solara URL is invalid, trying to get new one...');
            }

            // 如果當前 URL 無效，嘗試獲取新的
            const mainResponse = await axios.get('https://solaraweb.vercel.app/download', {
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });

            const text = mainResponse.data;
            const match = text.match(/https:\/\/([\w\d]+)\.solaraweb-alj\.pages\.dev/);
            if (match) {
                const newUrl = `${match[0]}/download/static/files/Bootstrapper.exe`;
                logger.system(`Found new Solara URL: ${newUrl}`);
                return newUrl;
            }

            throw new Error('Could not find valid Solara URL');
        } catch (error) {
            logger.error('Failed to get Solara URL:', error);
            throw error;
        }
    }

    /**
     * 獲取下載 URL
     */
    async getLatestDownloadUrl(gameId) {
        try {
            const config = this.executorConfigs[gameId.toUpperCase()];
            if (!config) {
                logger.error(`Invalid executor ID: ${gameId}`);
                throw new Error(`無效的執行器 ID: ${gameId}`);
            }
    
            logger.system(`Getting download URL for ${gameId}`);
    
            switch (gameId.toUpperCase()) {
                case 'SOLARA':
                    return await this.getSolaraUrl();
                case 'CLOUDY':
                    logger.system('Getting Cloudy URL');
                    return config.downloadUrl;
                case 'LUNA':
                    logger.system('Getting Luna URL');
                    return config.downloadUrl;
                default:
                    return config.downloadUrl;
            }
        } catch (error) {
            logger.error('Error in getLatestDownloadUrl:', error);
            throw new Error(error.message); // 直接傳遞原始錯誤信息
        }
    }
    
    /**
     * 重命名執行器文件
     */
    async renameExecutorFile(gameId, tempPath) {
        const config = this.executorConfigs[gameId.toUpperCase()];
        if (!config) {
            throw new Error('Invalid executor ID');
        }

        const renameMap = {
            'SOLARA': 'Solara-Setup.exe',
            'CLOUDY': 'Cloudy-Setup.exe',
            'LUNA': 'Luna-Setup.exe',
            'ZORARA': 'Zorara-Setup.exe'
        };

        const newFileName = renameMap[gameId.toUpperCase()] || path.basename(config.exePath);
        const finalPath = path.join(config.installDir, newFileName);

        // 如果目標文件已存在，先刪除
        if (await fs.pathExists(finalPath)) {
            await fs.remove(finalPath);
        }

        // 重命名文件
        await fs.rename(tempPath, finalPath);
        logger.system(`Renamed ${gameId} executor to ${newFileName}`);
        return finalPath;
    }

    /**
     * 獲取 Cloudy 下載 URL
     */
    async getCloudyUrl() {
        const config = this.executorConfigs.CLOUDY;
        if (!config.downloadUrl) {
            throw new Error('Cloudy download URL not available');
        }
        return config.downloadUrl;
    }

    /**
     * 獲取 Luna 下載 URL
     */
    async getLunaUrl() {
        const config = this.executorConfigs.LUNA;
        if (!config.downloadUrl) {
            throw new Error('Luna download URL not available');
        }
        return config.downloadUrl;
    }
    /**
     * 啟動執行器
     */
    async launchGame(gameId) {
        try {
            const config = this.executorConfigs[gameId.toUpperCase()];
            if (!config) {
                throw new Error('Invalid executor ID');
            }
    
            const checkResult = this.checkGameInstalled(gameId);
            if (!checkResult.exists) {
                throw new Error('Executor not found');
            }
    
            // 特別處理 Luna
            if (gameId.toUpperCase() === 'LUNA') {
                return new Promise((resolve, reject) => {
                    execFile(config.exePath, [], {
                        cwd: config.installDir,
                        env: {
                            ...process.env,
                            LOCALAPPDATA: config.installDir // 強制設置本地應用程式目錄
                        },
                        windowsHide: false
                    }, (error) => {
                        if (error) {
                            logger.error(`Error launching Luna: ${error}`);
                            reject(error);
                        } else {
                            logger.system(`Luna launched successfully from ${config.installDir}`);
                            resolve(true);
                        }
                    });
                });
            } else {
                // 其他執行器的正常啟動方式
                const process = spawn(config.exePath, [], {
                    detached: true,
                    stdio: 'ignore',
                    cwd: config.installDir
                });
                process.unref();
                logger.system(`${config.name} launched successfully from ${config.installDir}`);
                return true;
            }
        } catch (error) {
            logger.error(`Error launching executor: ${gameId}`, error);
            throw error;
        }
    }
}

// 導出單例
module.exports = new GameManager();