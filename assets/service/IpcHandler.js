// assets/service/IpcHandler.js
const { ipcMain, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const decompress = require('decompress');
const path = require('path');
const fs = require('fs-extra');      
const axios = require('axios');      
const CONFIG = require('./app-cfg');
const logger = require('./logger');
const windowManager = require('./WindowManager');
const adBlockManager = require('./AdBlockManager');
const gameManager = require('./GameManager');
class IpcHandler {
    constructor() {
        this.executorInstances = {
            solara: 0,
            wave: 0,
            zorara: 0
        };
        this.setupHandlers();
    }

    /**
     * 設置所有 IPC 事件處理器
     */
    setupHandlers() {
        // 窗口控制事件
        this._setupWindowControlHandlers();
        
        // 導航事件
        this._setupNavigationHandlers();
        
        // 執行器事件
        this._setupExecutorHandlers();
        
        // 廣告攔截事件
        this._setupAdBlockHandlers();

        // 遊戲處理器
        this._setupGameHandlers();

        // 主題處理器
        this._setupThemeHandlers();
        
        logger.ipc('IPC handlers initialized');
    }

    /**
     * 設置窗口控制相關的處理器
     */
    _setupWindowControlHandlers() {
        ipcMain.on('minimize-window', () => {
            logger.ipc('Minimize window requested');
            windowManager.minimize('main');
        });

        ipcMain.on('close-window', () => {
            logger.ipc('Close window requested');
            windowManager.close('main');
        });

        ipcMain.on('toggle-fullscreen', () => {
            logger.ipc('Toggle fullscreen requested');
            windowManager.toggleFullscreen();
        });

        ipcMain.on('open-menu-window', () => {
            logger.ipc('Open menu window requested');
            windowManager.createMenuWindow();
        });

        ipcMain.on('close-menu-window', () => {
            logger.ipc('Close menu window requested');
            if (windowManager.menuWindowInstance) {
                windowManager.close('menu');
            }
        });

        ipcMain.on('minimize-menu-window', () => {
            logger.ipc('Minimize menu window requested');
            windowManager.minimize('menu');
        });
    }

    /**
     * 設置導航相關的處理器
     */
    _setupNavigationHandlers() {
        ipcMain.on('return-home', () => {
            logger.ipc('Return to home requested');
            const mainWindow = windowManager.mainWindowInstance;
            if (mainWindow) {
                mainWindow.loadFile(path.join('assets/html/games.html'))
                    .catch(err => logger.error('Failed to load home page:', err));
            }
        });

        ipcMain.on('open-external-link', (event, url) => {
            logger.ipc(`Open external link requested: ${url}`);
            shell.openExternal(url).catch(err => 
                logger.error('Failed to open external link:', err)
            );
        });
    }
    /*
    * 主題
    */ 
    _setupThemeHandlers() {
        ipcMain.on('theme-change', (event, theme) => {
            logger.ipc(`Theme change requested: ${theme}`);
            windowManager.syncTheme(theme);
        });
    
        ipcMain.handle('get-initial-theme', async () => {
            try {
                const mainWindow = windowManager.mainWindowInstance;
                if (mainWindow) {
                    return await mainWindow.webContents.executeJavaScript(
                        'localStorage.getItem("fcheat-theme")'
                    );
                }
            } catch (error) {
                logger.error('Failed to get initial theme:', error);
            }
            return 'dark'; // 默認主題
        });
    }
    /**
     * 設置執行器相關的處理器
     */
    _setupExecutorHandlers() {
        ['solara', 'wave', 'zorara'].forEach(type => {
            ipcMain.on(`run-find-${type}`, () => {
                this._handleExecutorSearch(type);
            });
        });
    }
    /**
     * 設置遊戲處理器
     */
    _setupGameHandlers() {
        ipcMain.handle('check-game-installed', async (event, gameId) => {
            try {
                return await gameManager.checkGameInstalled(gameId);
            } catch (error) {
                logger.error('Failed to check game installation:', error);
                throw error;
            }
        });
    
        async function launchExecutor(gameId, exePath) {
            try {
                const process = spawn(exePath, [], {
                    detached: true,
                    stdio: 'ignore'
                });
                
                return new Promise((resolve, reject) => {
                    process.on('error', (error) => {
                        logger.error(`Error launching ${gameId}:`, error);
                        reject(error);
                    });
        
                    // 等待短暫時間確認進程啟動
                    setTimeout(() => {
                        if (!process.killed) {
                            process.unref();
                            resolve(true);
                        } else {
                            reject(new Error('進程啟動失敗'));
                        }
                    }, 1000);
                });
            } catch (error) {
                logger.error(`Failed to launch ${gameId}:`, error);
                throw error;
            }
        }
        
        ipcMain.handle('launch-game', async (event, gameId) => {
            try {
                const config = gameManager.executorConfigs[gameId.toUpperCase()];
                if (!config) {
                    throw new Error('Invalid executor ID');
                }
        
                const exists = await fs.pathExists(config.exePath);
                if (!exists) {
                    throw new Error('執行檔不存在');
                }
        
                await launchExecutor(gameId, config.exePath);
                logger.system(`${config.name} launched successfully`);
                return true;
            } catch (error) {
                logger.error(`Failed to launch game:`, error);
                throw error;
            }
        });
        ipcMain.handle('download-executor', async (event, gameId) => {
            try {
                const config = gameManager.executorConfigs[gameId.toUpperCase()];
                if (!config) {
                    throw new Error('Invalid executor ID');
                }
        
                // 獲取下載 URL
                const downloadUrl = await gameManager.getLatestDownloadUrl(gameId);
                logger.system(`Starting download for ${config.name} from ${downloadUrl}`);
                
                // 確保安裝目錄存在
                await fs.ensureDir(config.installDir);
        
                const isZip = downloadUrl.toLowerCase().endsWith('.zip');
                const tempPath = path.join(config.installDir, isZip ? 'temp.zip' : 'temp.exe');
        
                // 下載文件
                const response = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    responseType: 'stream',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                        'Accept': '*/*',
                        'Referer': new URL(downloadUrl).origin
                    }
                });
        
                if (response.status !== 200) {
                    throw new Error(`下載失敗: HTTP ${response.status}`);
                }
        
                // 寫入臨時文件
                await new Promise((resolve, reject) => {
                    const writer = fs.createWriteStream(tempPath);
                    response.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
        
                let finalPath;
                if (isZip) {
                    try {
                        logger.system(`Extracting zip file for ${config.name}`);
                        const tempExtractPath = path.join(config.installDir, 'temp_extract');
                        await fs.ensureDir(tempExtractPath);
                        
                        // 解壓檔案
                        await decompress(tempPath, tempExtractPath);
                        
                        // 查找 exe 文件
                        const files = await fs.readdir(tempExtractPath, { recursive: true });
                        const exeFile = files.find(file => file.toLowerCase().endsWith('.exe'));
                        
                        if (!exeFile) {
                            throw new Error('找不到執行檔');
                        }
        
                        // 移動到最終位置
                        finalPath = path.join(config.installDir, path.basename(config.exePath));
                        await fs.move(path.join(tempExtractPath, exeFile), finalPath, { overwrite: true });
                        
                        // 清理臨時文件
                        await fs.remove(tempPath);
                        await fs.remove(tempExtractPath);
                    } catch (error) {
                        // 清理臨時文件
                        await fs.remove(tempPath).catch(() => {});
                        await fs.remove(path.join(config.installDir, 'temp_extract')).catch(() => {});
                        throw error;
                    }
                } else {
                    finalPath = path.join(config.installDir, path.basename(config.exePath));
                    await fs.move(tempPath, finalPath, { overwrite: true });
                }
        
                logger.system(`Installation completed for ${config.name} at ${finalPath}`);
                return finalPath;
        
            } catch (error) {
                logger.error('Download failed:', error);
                // 直接拋出原始錯誤訊息，不再包裝
                throw error;
            }
        });
        
    }
    /**
     * 處理執行器搜索
     * @param {string} type - 執行器類型
     */
    async _handleExecutorSearch(type) {
        if (this.executorInstances[type] >= CONFIG.MAX_INSTANCES) {
            logger.ipc(`${type} executor search rejected: Max instances reached`);
            await this._showExecutorError(type);
            return;
        }

        const execPath = CONFIG.PATHS.SEARCH_TOOLS[type.toUpperCase()];
        logger.ipc(`Starting ${type} executor search`);

        try {
            const process = spawn(execPath);
            this.executorInstances[type]++;

            process.on('error', (error) => {
                logger.error(`Error in ${type} executor:`, error);
                this.executorInstances[type]--;
            });

            process.on('exit', (code) => {
                logger.ipc(`${type} executor process exited with code: ${code}`);
                this.executorInstances[type]--;
            });
        } catch (error) {
            logger.error(`Failed to start ${type} executor:`, error);
            this.executorInstances[type]--;
            await this._showExecutorError(type, true);
        }
    }

    /**
     * 顯示執行器錯誤信息
     */
    async _showExecutorError(type, isStartError = false) {
        const message = isStartError
            ? `${type} Executor 啟動失敗，請檢查文件是否存在或損壞`
            : `${type} Executor 查找過多,請等待當前查找系統查找完再執行`;

        await dialog.showMessageBox({
            type: 'error',
            title: '外掛查找系統',
            message
        });
    }

    /**
     * 設置廣告攔截相關的處理器
     */
    _setupAdBlockHandlers() {
        ipcMain.on('toggle-ad-blocking', (event, shouldEnable) => {
            logger.ipc(`Toggle ad blocking requested: ${shouldEnable}`);
            if (shouldEnable !== undefined) {
                shouldEnable ? adBlockManager.enable() : adBlockManager.disable();
            } else {
                adBlockManager.toggle();
            }
            event.reply('ad-block-status', 
                adBlockManager.isEnabled ? "廣告攔截已啟用" : "廣告攔截已禁用"
            );
        });
    }
}

// 導出單例
module.exports = new IpcHandler();