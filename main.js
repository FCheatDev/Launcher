// main.js
const { app } = require('electron');
const path = require('path');

// 導入配置和服務
const CONFIG = require('./assets/service/app-cfg');
const logger = require('./assets/service/logger');
const windowManager = require('./assets/service/WindowManager');
const updateManager = require('./assets/service/UpdateManager');
const adBlockManager = require('./assets/service/AdBlockManager');
const ipcHandler = require('./assets/service/IpcHandler');
const folderManager = require('./assets/service/FolderManager');
const discordRPCManager = require('./assets/service/DiscordRPCManager');

/**
 * 應用初始化
 */
function setupDevTools() {
    const { globalShortcut } = require('electron');

    // 註冊 Ctrl+Shift+I 快捷鍵
    globalShortcut.register('CommandOrControl+Shift+I', () => {
        if (windowManager.mainWindowInstance) {
            // 如果開發者工具已打開，則關閉
            if (windowManager.mainWindowInstance.webContents.isDevToolsOpened()) {
                windowManager.mainWindowInstance.webContents.closeDevTools();
            } else {
                // 在新窗口中打開開發者工具
                windowManager.mainWindowInstance.webContents.openDevTools({
                    mode: 'detach', // 在新窗口中打開
                });
            }
        }
    });

    // 在應用退出時取消註冊快捷鍵
    app.on('will-quit', () => {
        globalShortcut.unregisterAll();
    });
}

async function initializeApp() {
    try {
        logger.system('Starting application initialization');

        // 初始化文件夾結構
        await folderManager.initialize();
        logger.system('Folders initialized');

        // 檢查更新
        await updateManager.initialize();
        logger.system('Update manager initialized');

        // 初始化 Discord RPC
        await discordRPCManager.initialize();
        logger.system('discordRPC manager initialized');

        if (!updateManager.isUpdateAvailable) {
            // 創建主窗口
            windowManager.createMainWindow();
            logger.system('Main window created');

            // 設置開發者工具快捷鍵
            setupDevTools();
            logger.system('DevTools shortcuts initialized');

            // 初始化廣告攔截
            // IpcHandler 會在導入時自動初始化
            logger.system('All systems initialized successfully');
        } else {
            logger.system('Update available, halting normal initialization');
        }

    } catch (error) {
        logger.error('Failed to initialize application:', error);
        await handleInitError(error);
    }
}

/**
 * 初始化錯誤處理
 */
async function handleInitError(error) {
    const { dialog } = require('electron');

    logger.error('Critical initialization error:', error);

    await dialog.showMessageBox({
        type: 'error',
        title: '初始化錯誤',
        message: '應用程序初始化失敗',
        detail: `錯誤信息: ${error.message}\n請檢查日誌文件以獲取詳細信息。`,
        buttons: ['關閉']
    });

    app.quit();
}

/**
 * 應用事件處理
 */
function setupAppEvents() {
    // 應用準備就緒
    app.whenReady().then(async () => {
        logger.system('Application ready event received');
        await initializeApp();
    }).catch(error => {
        logger.error('Failed to initialize on ready:', error);
        handleInitError(error);
    });

    // 所有窗口關閉
    app.on('window-all-closed', () => {
        logger.system('All windows closed, forcing app to quit');
        // 強制結束所有子進程
        process.exit(0);
    });

    // 應用激活（macOS）
    app.on('activate', () => {
        logger.system('Application activated');
        if (!windowManager.mainWindowInstance) {
            windowManager.createMainWindow();
        }
    });

    // 應用退出前
    app.on('before-quit', () => {
        logger.system('Application is quitting');
        // 清理資源
        updateManager.destroy();
        // 清理 Discord RPC
        discordRPCManager.destroy();
        // 強制結束所有渲染進程
        if (windowManager.mainWindowInstance) {
            windowManager.mainWindowInstance.webContents.forcefullyTerminateRenderer();
        }
    });

    // 第二個實例啟動
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        logger.system('Another instance is already running, quitting');
        app.quit();
    } else {
        app.on('second-instance', () => {
            logger.system('Second instance detected');
            // 如果有主窗口，則顯示並聚焦
            if (windowManager.mainWindowInstance) {
                if (windowManager.mainWindowInstance.isMinimized()) {
                    windowManager.mainWindowInstance.restore();
                }
                windowManager.mainWindowInstance.focus();
            }
        });
    }

    // 開發環境下的特殊處理
    if (process.env.NODE_ENV === 'development') {
        app.on('ready', () => {
            const { globalShortcut } = require('electron');

            // 註冊開發者工具快捷鍵
            globalShortcut.register('Control+Shift+I', () => {
                if (windowManager.mainWindowInstance) {
                    windowManager.mainWindowInstance.webContents.openDevTools({
                        mode: 'detach'
                    });
                }
            });
        });

        // 開發環境下的退出處理
        app.on('will-quit', () => {
            const { globalShortcut } = require('electron');
            globalShortcut.unregisterAll();
        });
    }

    // 捕獲未處理的錯誤和拒絕
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection:', reason);
    });
}

// 設置應用事件並啟動
setupAppEvents();
module.exports.setupDevTools = setupDevTools;
// 導出主要組件供其他模塊使用
module.exports = {
    windowManager,
    updateManager,
    adBlockManager,
    folderManager,
    discordRPCManager,
    CONFIG
};