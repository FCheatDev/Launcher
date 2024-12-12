// assets/service/WindowManager.js
const { BrowserWindow, screen } = require('electron');
const path = require('path');
const CONFIG = require('../../config/app-cfg');
const logger = require('./logger');

class WindowManager {
    constructor() {
        this.mainWindow = null;
        this.menuWindow = null;
        this._initMonitorMenuPosition();
    }

    /**
     * 創建主視窗
     */
    createMainWindow() {
        logger.window('Creating main window');
        
        this.mainWindow = new BrowserWindow({
            ...CONFIG.WINDOW.MAIN.DEFAULT_SIZE,
            frame: false,
            movable: true,
            resizable: true,
            fullscreenable: true,
            icon: CONFIG.WINDOW.MAIN.ICON,
            webPreferences: {
                preload: CONFIG.PATHS.PRELOAD,
                contextIsolation: true,
                enableRemoteModule: false,
                nodeIntegration: true,
            },
        });

        this.mainWindow.loadFile('launcher.html')
            .catch(err => {
                logger.error('Failed to load main window:', err);
            });

        this._setupMainWindowEvents();
        logger.window('Main window created successfully');
        
        return this.mainWindow;
    }

    /**
     * 創建菜單視窗
     */
    createMenuWindow() {
        if (this.menuWindow) {
            logger.window('Menu window already exists');
            return;
        }

        logger.window('Creating menu window');
        
        this.menuWindow = new BrowserWindow({
            ...CONFIG.WINDOW.MENU.DEFAULT_SIZE,
            frame: false,
            transparent: true,
            icon: CONFIG.WINDOW.MENU.ICON,
            fullscreenable: false,
            maximizable: false,
            alwaysOnTop: true,
            resizable: false,
            webPreferences: {
                preload: CONFIG.PATHS.PRELOAD,
                nodeIntegration: true,
                contextIsolation: false,
            },
        });

        this.menuWindow.loadFile('menu.html')
            .catch(err => {
                logger.error('Failed to load menu window:', err);
            });

        this._setupMenuWindowEvents();
        logger.window('Menu window created successfully');
    }

    /**
     * 設置主視窗事件
     */
    _setupMainWindowEvents() {
        this.mainWindow.on('resize', () => {
            const bounds = this.mainWindow.getBounds();
            this.mainWindow.webContents.send('window-resized', bounds);
            logger.window('Main window resized:', bounds);
        });

        this.mainWindow.on('close', () => {
            logger.window('Main window closing');
        });

        this.mainWindow.on('maximize', () => {
            logger.window('Main window maximized');
        });

        this.mainWindow.on('unmaximize', () => {
            logger.window('Main window unmaximized');
        });
    }

    /**
     * 設置菜單視窗事件
     */
    _setupMenuWindowEvents() {
     this.menuWindow.on('closed', () => {
         this.menuWindow = null;
         logger.window('Menu window closed');
     });

     // 不再添加 blur 事件，讓菜單保持打開狀態
 }

    /**
     * 監控菜單視窗位置
     */
    _initMonitorMenuPosition() {
        setInterval(() => {
            if (this.menuWindow) {
                const bounds = this.menuWindow.getBounds();
                const display = screen.getPrimaryDisplay().workAreaSize;
                
                const newBounds = {
                    x: Math.min(Math.max(bounds.x, 0), display.width - bounds.width),
                    y: Math.min(Math.max(bounds.y, 0), display.height - bounds.height)
                };

                if (newBounds.x !== bounds.x || newBounds.y !== bounds.y) {
                    this.menuWindow.setBounds({ ...bounds, ...newBounds });
                }
            }
        }, 100);
    }

    /**
     * 切換全屏
     */
    toggleFullscreen() {
        if (!this.mainWindow) return;
        
        const isMaximized = this.mainWindow.isMaximized();
        if (!isMaximized) {
            this.mainWindow.setFullScreen(false);
            this.mainWindow.setResizable(true);
            this.mainWindow.maximize();
            this.mainWindow.setMenuBarVisibility(false);
            logger.window('Main window maximized');
        } else {
            this.mainWindow.unmaximize();
            this.mainWindow.setMenuBarVisibility(true);
            logger.window('Main window unmaximized');
        }
    }

    /**
     * 最小化窗口
     */
    minimize(windowType = 'main') {
        const window = windowType === 'main' ? this.mainWindow : this.menuWindow;
        if (window) {
            window.minimize();
            logger.window(`${windowType} window minimized`);
        }
    }

    /**
     * 關閉窗口
     */
    close(windowType = 'main') {
        const window = windowType === 'main' ? this.mainWindow : this.menuWindow;
        if (window) {
            window.close();
            logger.window(`${windowType} window closed`);
        }
    }

    /**
     * 重新加載主視窗
     */
    reloadMain() {
        if (this.mainWindow) {
            this.mainWindow.reload();
            logger.window('Main window reloaded');
        }
    }

    /**
     * 獲取窗口實例
     */
    get mainWindowInstance() {
        return this.mainWindow;
    }

    get menuWindowInstance() {
        return this.menuWindow;
    }


    
    /**
     * 獲取所有活動的窗口
     * @returns {BrowserWindow[]} 所有活動窗口的數組
     */
    getAllWindows() {
        const windows = [];
        if (this.mainWindow) windows.push(this.mainWindow);
        if (this.menuWindow) windows.push(this.menuWindow);
        return windows;
    }

    /**
     * 廣播事件到所有窗口
     * @param {string} channel - 事件名稱
     * @param {...any} args - 事件參數
     */
    broadcastToAll(channel, ...args) {
        const windows = this.getAllWindows();
        windows.forEach(window => {
            if (window && !window.isDestroyed()) {
                window.webContents.send(channel, ...args);
            }
        });
    }

    /**
     * 同步主題到所有窗口
     * @param {string} theme - 主題名稱
     */
    syncTheme(theme) {
        logger.window(`Syncing theme: ${theme} to all windows`);
        this.broadcastToAll('theme-changed', theme);
    }














}

// 導出單例
module.exports = new WindowManager();