const { app, dialog } = require('electron');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const CONFIG = require('../config/constants');
const Logger = require('./Logger');

class UpdateManager {
    constructor() {
        this.isUpdateAvailable = false;
        this.currentVersion = CONFIG.app.currentVersion;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            Logger.info('Initializing update manager...');
            
            // 獲取當前版本
            this.currentVersion = await this.getLocalVersion();
            this.initialized = true;
            
            Logger.info('Update manager initialized successfully');
        } catch (error) {
            Logger.error('Failed to initialize update manager:', error);
            this.initialized = false;
            throw error;
        }
    }

    async checkForUpdates(mainWindow) {
        if (!this.initialized) {
            throw new Error('Update manager not initialized');
        }

        Logger.info(CONFIG.messages.update.checking);
        try {
            const latestRelease = await this.fetchLatestRelease();
            if (!latestRelease) {
                Logger.info(CONFIG.messages.update.notAvailable);
                return;
            }

            const shouldUpdate = await this.compareVersions(latestRelease);
            if (shouldUpdate) {
                await this.handleUpdate(latestRelease, mainWindow);
            } else {
                Logger.info(CONFIG.messages.update.notAvailable);
            }
        } catch (error) {
            Logger.error(CONFIG.errorMessages.update.checkFailed, error);
            await this.showUpdateError(mainWindow);
        }
    }

    async fetchLatestRelease() {
        try {
            const response = await axios.get(CONFIG.github.repo.releaseUrl);
            return response.data;
        } catch (error) {
            Logger.error('Error fetching latest release:', error);
            return null;
        }
    }

    async compareVersions(latestRelease) {
        if (!latestRelease || !latestRelease.tag_name) return false;
        const latestVersion = latestRelease.tag_name.replace('v', '');
        return latestVersion > this.currentVersion;
    }

    async handleUpdate(latestRelease, mainWindow) {
        const response = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            buttons: ['更新'],
            title: '更新提示',
            message: CONFIG.messages.update.available(latestRelease.tag_name)
        });
        
        if (response.response === 0) {
            this.isUpdateAvailable = true;
            await this.downloadAndUpdate(latestRelease);
        }
    }

    async downloadAndUpdate(latestRelease) {
        try {
            Logger.info(CONFIG.messages.update.downloading);
            const asset = latestRelease.assets.find(asset => asset.name.endsWith('.exe'));
            if (!asset) throw new Error('No executable found in release');

            await fs.mkdir(CONFIG.paths.updates, { recursive: true });
            const filePath = path.join(CONFIG.paths.updates, asset.name);
            const writer = fs.createWriteStream(filePath);
            
            const response = await axios({
                url: asset.browser_download_url,
                method: 'GET',
                responseType: 'stream'
            });

            return new Promise((resolve, reject) => {
                response.data.pipe(writer);
                writer.on('finish', () => {
                    Logger.info(CONFIG.messages.update.installing);
                    this.launchUpdater(filePath);
                    resolve(true);
                });
                writer.on('error', (err) => {
                    Logger.error(CONFIG.errorMessages.update.downloadFailed, err);
                    reject(err);
                });
            });
        } catch (error) {
            Logger.error(CONFIG.errorMessages.update.installFailed, error);
            return false;
        }
    }

    launchUpdater(filePath) {
        try {
            const updateProcess = spawn(filePath, {
                detached: true,
                shell: true
            });

            updateProcess.on('error', (error) => {
                Logger.error('Error launching updater:', error);
            });

            updateProcess.unref();
            app.quit();
        } catch (error) {
            Logger.error('Failed to launch updater:', error);
        }
    }

    async getLocalVersion() {
        try {
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageData = await fs.readFile(packagePath, 'utf8');
            const packageJson = JSON.parse(packageData);
            return packageJson.version || CONFIG.app.currentVersion;
        } catch (error) {
            Logger.error('Error reading package.json:', error);
            return CONFIG.app.currentVersion;
        }
    }
}

module.exports = new UpdateManager();