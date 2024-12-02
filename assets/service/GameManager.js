// assets/service/GameManager.js
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const CONFIG = require('../../config/main');
const logger = require('./logger');

class GameManager {
    constructor() {
        this.executorConfigs = CONFIG.EXECUTORS;
    }

    /**
     * 檢查執行器是否已安裝
     */
    async checkGameInstalled(gameId) {
        try {
            const config = this.executorConfigs[gameId.toUpperCase()];
            if (!config) {
                logger.error(`Invalid executor ID: ${gameId}`);
                throw new Error('Invalid executor ID');
            }
    
            logger.system(`Checking for ${config.name}...`);
            const exists = await fs.pathExists(config.exePath);
            logger.system(`${config.name} ${exists ? 'found' : 'not found'} at ${config.exePath}`);
            return {
                exists,
                path: exists ? config.exePath : null
            };
        } catch (error) {
            logger.error(`Error checking executor: ${gameId}`, error);
            throw error;
        }
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

            const exists = await this.checkGameInstalled(gameId);
            if (!exists) {
                throw new Error('Executor not found');
            }

            const process = spawn(config.exePath, [], {
                detached: true,
                stdio: 'ignore'
            });
            
            process.unref();
            logger.system(`${config.name} launched successfully`);
            return true;
        } catch (error) {
            logger.error(`Error launching executor: ${gameId}`, error);
            throw error;
        }
    }
}

module.exports = new GameManager();