// assets/service/UpdateManager.js
const { app, dialog } = require('electron');
const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const CONFIG = require('../../config/config');
const logger = require('./logger');
const windowManager = require('./WindowManager');

class UpdateManager {
    constructor() {
        this.isUpdateAvailable = false;
        this.updateInProgress = false;
        this.currentVersion = null;
        this.latestVersion = null;
        this.updateInterval = null;
    }

    /**
     * 初始化更新管理器
     */
    async initialize() {
        try {
            await this._ensureUpdateDirectory();
            this.currentVersion = await this._getLocalVersion();
            logger.update('Update manager initialized', {
                currentVersion: this.currentVersion,
                updatePath: CONFIG.PATHS.UPDATES
            });
            
            // 立即檢查一次更新
            await this.checkForUpdates();
            
            // 設置定期檢查
            this.setupAutoCheck();
        } catch (error) {
            logger.error('Failed to initialize update manager:', { error });
            throw error;
        }
    }

    /**
     * 確保更新目錄存在
     */
    async _ensureUpdateDirectory() {
        try {
            await fs.ensureDir(CONFIG.PATHS.UPDATES);
            logger.update('Update directory verified', {
                path: CONFIG.PATHS.UPDATES
            });
        } catch (error) {
            logger.error('Failed to ensure update directory:', { error });
            throw error;
        }
    }

    /**
     * 獲取本地版本
     */
    async _getLocalVersion() {
        try {
            const packageJson = await fs.readJson(CONFIG.PATHS.PACKAGE);
            console.log('Package.json content:', packageJson); // 調試輸出
            logger.update('Retrieved local version', { version: packageJson.version });
            return packageJson.version;
        } catch (error) {
            logger.error('Failed to get local version:', { error });
            throw error;
        }
    }

    /**
     * 設置自動檢查更新
     */
    setupAutoCheck() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(
            () => this.checkForUpdates(false), // 不顯示"無更新"的對話框
            3600000 // 1小時
        );

        logger.update('Auto update check scheduled');
    }

        /**
     * 檢查更新
     */
        async checkForUpdates() {
          if (this.updateInProgress) {
              return;
          }
  
          try {
              logger.update('Checking for updates...');
  
              const response = await axios.get(
                  'https://api.github.com/repos/FCheatDev/Launcher/releases/latest',
                  {
                      headers: {
                          'Accept': 'application/vnd.github.v3+json',
                          'User-Agent': 'FCheat-Launcher'
                      }
                  }
              );
  
              const latestRelease = response.data;
              this.latestVersion = latestRelease.tag_name.replace('v', '');
  
              logger.update('Latest version found', {
                  currentVersion: this.currentVersion,
                  latestVersion: this.latestVersion
              });
  
              // 比較版本
              if (this._compareVersions(this.latestVersion, this.currentVersion) > 0) {
                  this.isUpdateAvailable = true;
                  await this._notifyAndUpdate(latestRelease);
              }
          } catch (error) {
              logger.error('Failed to check for updates:', { error });
              this._showError('檢查更新失敗', error.message);
          }
      }
  
      /**
       * 通知並開始更新
       */
      async _notifyAndUpdate(latestRelease) {
          try {
              // 先顯示更新提示
              await dialog.showMessageBox(windowManager.mainWindowInstance, {
                  type: 'info',
                  title: '發現新版本',
                  message: `當前版本: ${this.currentVersion}\n最新版本: ${this.latestVersion}`,
                  detail: latestRelease.body || '版本更新提示',
                  buttons: ['確定'],
                  noLink: true,
                  defaultId: 0
              });
  
              // 顯示正在更新提示
              await this._showUpdateProgress();
              
              // 開始更新
              await this.downloadAndUpdate(latestRelease);
          } catch (error) {
              logger.error('Update process failed:', { error });
              this._showError('更新過程失敗', error.message);
          }
      }
  
      /**
       * 顯示更新進度
       */
      async _showUpdateProgress() {
          return dialog.showMessageBox(windowManager.mainWindowInstance, {
              type: 'info',
              title: '系統更新',
              message: '新版本正在下載安裝中\n安裝完成後程序將自動重啟\n請稍候...',
              buttons: ['確定'],
              noLink: true
          });
      }
  
      /**
       * 顯示錯誤信息
       */
      async _showError(title, message) {
          return dialog.showMessageBox(windowManager.mainWindowInstance, {
              type: 'error',
              title: title,
              message: message,
              buttons: ['確定'],
              noLink: true
          });
      }

    /**
     * 比較版本號
     */
    _compareVersions(version1, version2) {
        console.log('Comparing versions:', version1, version2); // 調試輸出
        const v1 = version1.split('.').map(Number);
        const v2 = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0;
    }

    /**
     * 處理發現更新
     */
    async _handleUpdateAvailable(latestRelease) {
        try {
            const result = await dialog.showMessageBox(windowManager.mainWindowInstance, {
                type: 'info',
                buttons: ['更新', '稍後'],
                title: '發現新版本',
                message: `發現新版本: ${this.latestVersion}\n當前版本: ${this.currentVersion}`,
                detail: latestRelease.body || '暫無更新說明'
            });

            if (result.response === 0) {
                await this._showUpdateProgress('正在下載更新...');
                await this.downloadAndUpdate(latestRelease);
            } else {
                logger.update('Update postponed by user');
            }
        } catch (error) {
            logger.error('Failed to handle update:', { error });
            throw error;
        }
    }

    /**
     * 顯示更新進度
     */
    async _showUpdateProgress(message) {
        return dialog.showMessageBox(windowManager.mainWindowInstance, {
            type: 'info',
            title: '更新進度',
            message: message,
            buttons: ['確定']
        });
    }

    /**
     * 下載並更新
     */
    async downloadAndUpdate(latestRelease) {
        this.updateInProgress = true;
        
        try {
            const asset = latestRelease.assets.find(asset => 
                asset.name.endsWith('.exe')
            );

            if (!asset) {
                throw new Error('找不到可執行文件');
            }

            logger.update('Starting update download', { 
                assetName: asset.name,
                downloadUrl: asset.browser_download_url 
            });
            
            const filePath = await this._downloadUpdate(asset);
            await this._executeUpdate(filePath);
            
        } catch (error) {
            this.updateInProgress = false;
            logger.error('Update failed:', { error });
            await this._showUpdateError(error);
            throw error;
        }
    }

    /**
     * 下載更新文件
     */
    async _downloadUpdate(asset) {
        const filePath = path.join(CONFIG.PATHS.UPDATES, asset.name);
        const writer = fs.createWriteStream(filePath);

        try {
            const response = await axios({
                url: asset.browser_download_url,
                method: 'GET',
                responseType: 'stream',
                headers: {
                    'User-Agent': 'FCheat-Launcher'
                }
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            logger.update('Update downloaded successfully', { filePath });
            return filePath;
        } catch (error) {
            writer.end();
            await fs.remove(filePath).catch(() => {});
            throw error;
        }
    }

    /**
     * 執行更新
     */
    async _executeUpdate(filePath) {
        try {
            logger.update('Executing update process', { filePath });
            
            const updateProcess = spawn(filePath, { 
                detached: true, 
                shell: true 
            });

            updateProcess.on('error', (error) => {
                logger.error('Error executing update:', { error });
            });

            // 分離更新進程
            updateProcess.unref();
            
            // 退出當前應用
            app.quit();
        } catch (error) {
            logger.error('Failed to execute update:', { error });
            throw error;
        }
    }

    /**
     * 顯示更新錯誤
     */
    async _showUpdateError(error) {
        await dialog.showMessageBox(windowManager.mainWindowInstance, {
            type: 'error',
            title: '更新失敗',
            message: '更新過程中發生錯誤',
            detail: error.message,
            buttons: ['確定']
        });
    }

    /**
     * 清理舊的更新文件
     */
    async cleanOldUpdates() {
        try {
            const files = await fs.readdir(CONFIG.PATHS.UPDATES);
            
            for (const file of files) {
                const filePath = path.join(CONFIG.PATHS.UPDATES, file);
                await fs.remove(filePath);
            }
            
            logger.update('Old update files cleaned');
        } catch (error) {
            logger.error('Failed to clean old updates:', { error });
        }
    }

    /**
     * 獲取更新狀態
     */
    getUpdateStatus() {
        return {
            currentVersion: this.currentVersion,
            latestVersion: this.latestVersion,
            isUpdateAvailable: this.isUpdateAvailable,
            updateInProgress: this.updateInProgress
        };
    }

    /**
     * 銷毀更新管理器
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        logger.update('Update manager destroyed');
    }
}

// 導出單例
module.exports = new UpdateManager();