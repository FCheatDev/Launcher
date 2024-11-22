// assets/service/IpcHandler.js
const { ipcMain, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const CONFIG = require('../../config/config');
const logger = require('./logger');
const windowManager = require('./WindowManager');
const adBlockManager = require('./AdBlockManager');

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
                mainWindow.loadFile(path.join('assets/Games/games.html'))
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