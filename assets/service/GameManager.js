// assets/service/GameManager.js
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');
const CONFIG = require('../../config/main');
const logger = require('./logger');

class GameManager {
    constructor() {
        this.gameConfigs = CONFIG.GAMES;
    }

    /**
     * 檢查遊戲是否已安裝
     */
    async checkGameInstalled(gameId) {
        try {
            const game = this.gameConfigs[gameId.toUpperCase()];
            if (!game) {
                logger.error(`Invalid game ID: ${gameId}`);
                throw new Error('Invalid game ID');
            }

            const exists = await fs.pathExists(game.exePath);
            logger.system(`Checked game installation: ${gameId}, exists: ${exists}`);
            return exists;
        } catch (error) {
            logger.error(`Error checking game installation: ${gameId}`, error);
            throw error;
        }
    }

    /**
     * 安裝遊戲
     */
    async installGame(gameId, progressCallback) {
        try {
            const game = this.gameConfigs[gameId.toUpperCase()];
            if (!game) {
                throw new Error('Invalid game ID');
            }

            logger.system(`Starting game installation: ${gameId}`);
            
            // 確保安裝目錄存在
            await fs.ensureDir(game.installDir);

            // 下載遊戲
            const response = await axios({
                method: 'GET',
                url: game.downloadUrl,
                responseType: 'stream'
            });

            // 創建寫入流
            const writer = fs.createWriteStream(game.exePath);
            response.data.pipe(writer);

            // 處理下載進度
            const totalLength = parseInt(response.headers['content-length'], 10);
            let downloadedLength = 0;

            response.data.on('data', (chunk) => {
                downloadedLength += chunk.length;
                const progress = Math.round((downloadedLength * 100) / totalLength);
                if (progressCallback) {
                    progressCallback(progress);
                }
            });

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            logger.system(`Game installation completed: ${gameId}`);
            return true;
        } catch (error) {
            logger.error(`Error installing game: ${gameId}`, error);
            throw error;
        }
    }

    /**
     * 啟動遊戲
     */
    async launchGame(gameId) {
        try {
            const game = this.gameConfigs[gameId.toUpperCase()];
            if (!game) {
                throw new Error('Invalid game ID');
            }

            const exists = await this.checkGameInstalled(gameId);
            if (!exists) {
                throw new Error('Game is not installed');
            }

            logger.system(`Launching game: ${gameId}`);
            
            const process = spawn(game.exePath, [], {
                detached: true,
                stdio: 'ignore'
            });
            
            process.unref();
            return true;
        } catch (error) {
            logger.error(`Error launching game: ${gameId}`, error);
            throw error;
        }
    }

    /**
     * 獲取已安裝的遊戲列表
     */
    async getInstalledGames() {
        try {
            const installedGames = [];
            
            for (const [id, game] of Object.entries(this.gameConfigs)) {
                const installed = await this.checkGameInstalled(id);
                if (installed) {
                    installedGames.push({
                        id: id.toLowerCase(),
                        name: game.name,
                        path: game.exePath
                    });
                }
            }

            logger.system(`Found ${installedGames.length} installed games`);
            return installedGames;
        } catch (error) {
            logger.error('Error getting installed games list', error);
            throw error;
        }
    }
}

module.exports = new GameManager();