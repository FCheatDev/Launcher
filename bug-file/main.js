// main.js
const { 
    app, 
    ipcMain, 
    shell, 
    globalShortcut, 
    dialog,
    BrowserWindow 
} = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 導入服務
const WindowManager = require('./services/WindowManager');
const UpdateManager = require('./services/UpdateManager');
const AdBlockManager = require('./services/AdBlockManager');
const Logger = require('./services/Logger');
const CONFIG = require('./config/constants');

class Application {
    constructor() {
        this.instanceCounts = {
            solara: 0,
            wave: 0,
            zorara: 0
        };
        this.windowManager = WindowManager;
        this.updateManager = UpdateManager;
        this.adBlockManager = AdBlockManager;
    }

    async initialize() {
        await app.whenReady();
        Logger.system('Starting application initialization...', {
            version: app.getVersion(),
            platform: process.platform,
            arch: process.arch
        });
        
        try {
            await this.updateManager.initialize();
            Logger.info('Update manager initialized');

            await this.updateManager.checkForUpdates(this.windowManager.mainWindow);
            Logger.info('Update check completed');

            if (!this.updateManager.isUpdateAvailable) {
                await this.setup();
            }
        } catch (error) {
            Logger.error('Initialization failed', error);
            dialog.showMessageBoxSync({
                type: 'error',
                title: '初始化錯誤',
                message: '應用程序初始化失敗，請重新啟動。'
            });
            app.quit();
        }
    }

    async setup() {
        try {
            const mainWindow = this.windowManager.createMainWindow();
            Logger.info('Main window created');

            this.setupIpcHandlers(mainWindow);
            Logger.info('IPC handlers setup completed');

            this.createFolderStructure();
            Logger.info('Folder structure created');

            this.windowManager.monitorMenuPosition();
            Logger.info('Menu position monitoring started');

            this.adBlockManager.initialize();
            Logger.info('Ad blocker initialized');
            
            this.setupCleanup();
            Logger.info('Cleanup handlers setup completed');
            
            Logger.system('Application setup completed successfully');
        } catch (error) {
            Logger.error('Setup failed', error);
            throw error;
        }
    }

    setupIpcHandlers(mainWindow) {
            ipcMain.on('return-home', () => {
        Logger.info('Received return home request');
        try {
            // 確保主視窗存在並將其顯示出來
            if (this.windowManager.mainWindow) {
                // 先讓主視窗載入首頁
                this.windowManager.mainWindow.loadFile('assets/Games/games.html')
                    .then(() => {
                        // 載入完成後，確保菜單視窗在最上層
                        if (this.windowManager.menuWindow) {
                            this.windowManager.menuWindow.setAlwaysOnTop(true);
                            this.windowManager.menuWindow.focus();
                        }
                    })
                    .catch(err => {
                        Logger.error('Error loading launcher:', err);
                    });
                Logger.info('Returned to home page');
            } else {
                Logger.warn('Main window not found, creating new one');
                this.windowManager.createMainWindow();
            }
        } catch (error) {
            Logger.error('Error handling return home:', error);
        }
    });
        // 視窗控制
        ipcMain.on('minimize-window', () => {
            Logger.debug('Window minimized');
            this.windowManager.minimizeMainWindow();
        });

        ipcMain.on('close-window', () => {
            Logger.debug('Window closed');
            this.windowManager.closeMainWindow();
        });

        // 菜單視窗控制
        ipcMain.on('open-menu-window', (event) => {
            Logger.info('Received request to open menu window');
            try {
                if (this.windowManager.menuWindow) {
                    Logger.info('Menu window exists, showing and focusing');
                    this.windowManager.menuWindow.show();
                    this.windowManager.menuWindow.focus();
                } else {
                    Logger.info('Creating new menu window');
                    const menuWindow = this.windowManager.createMenuWindow();
                    if (menuWindow) {
                        Logger.info('Menu window created successfully');
                    } else {
                        Logger.error('Failed to create menu window');
                    }
                }
            } catch (error) {
                Logger.error('Error opening menu window:', error);
            }
        });

        ipcMain.on('minimize-menu-window', () => {
            Logger.debug('Menu window minimized');
            this.windowManager.minimizeMenuWindow();
        });

        ipcMain.on('close-menu-window', () => {
            Logger.debug('Menu window closed');
            this.windowManager.closeMenuWindow();
        });

        // 廣告阻擋
        ipcMain.on('toggle-ad-blocking', (event, shouldEnable) => {
            Logger.info(`Ad blocking ${shouldEnable ? 'enabled' : 'disabled'}`);
            const isEnabled = this.adBlockManager.toggle();
            event.reply('ad-block-status', 
                isEnabled ? "廣告攔截已啟用" : "廣告攔截已禁用"
            );
        });

        // 遊戲執行器處理
        this.setupGameHandlers();
    }
    

    setupGameHandlers() {
        const setupGameHandler = (game) => {
            ipcMain.on(`run-find-${game}`, () => {
                Logger.info(`Attempting to start ${game} executor`);

                if (this.instanceCounts[game] >= CONFIG.app.maxInstances) {
                    Logger.warn(`${game} executor instance limit reached`);
                    dialog.showMessageBoxSync({
                        type: 'error',
                        title: '外掛查找系統',
                        message: CONFIG.errorMessages.instance.tooMany(game)
                    });
                    return;
                }

                const process = spawn(CONFIG.paths.executables[game]);
                this.instanceCounts[game]++;
                Logger.info(`${game} executor started, instance count: ${this.instanceCounts[game]}`);

                process.on('exit', (code) => {
                    this.instanceCounts[game]--;
                    Logger.info(`${game} executor exited with code ${code}, instance count: ${this.instanceCounts[game]}`);
                });

                process.on('error', (err) => {
                    Logger.error(`${game} executor error`, err);
                    this.instanceCounts[game]--;
                });
            });
        };

        ['solara', 'wave', 'zorara'].forEach(setupGameHandler);
    }

    setupCleanup() {
        // 註銷所有全局快捷鍵
        app.on('will-quit', () => {
            Logger.system('Application shutting down...');
            globalShortcut.unregisterAll();
            this.adBlockManager.cleanup();
            this.windowManager.cleanup();
            Logger.cleanup();
        });

        // 關閉所有視窗時退出應用
        app.on('window-all-closed', () => {
            Logger.info('All windows closed');
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        // 定期清理舊日誌
        setInterval(() => {
            Logger.cleanOldLogs();
        }, 24 * 60 * 60 * 1000);
    }

    createFolderStructure() {
        Logger.info('Creating folder structure...');

        try {
            // 創建配置資料夾
            if (!fs.existsSync(CONFIG.paths.config)) {
                fs.mkdirSync(CONFIG.paths.config, { recursive: true });
                Logger.info('Created config folder');
            }

            // 創建遊戲資料夾
            if (!fs.existsSync(CONFIG.paths.games.main)) {
                fs.mkdirSync(CONFIG.paths.games.main);
                Logger.info('Created games main folder');
            }

            // 創建遊戲子資料夾
            CONFIG.paths.games.subFolders.forEach(folder => {
                const folderPath = path.join(CONFIG.paths.games.main, folder);
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath);
                    Logger.info(`Created ${folder} subfolder`);
                }
            });

            Logger.info('Folder structure setup completed');
        } catch (error) {
            Logger.error('Error creating folder structure', error);
            throw error;
        }
    }
}

// 建立並啟動應用程序
const application = new Application();
application.initialize().catch(error => {
    Logger.error('Application failed to start', error);
    dialog.showMessageBoxSync({
        type: 'error',
        title: '啟動錯誤',
        message: '應用程序啟動失敗，請重新啟動。'
    });
    app.quit();
});