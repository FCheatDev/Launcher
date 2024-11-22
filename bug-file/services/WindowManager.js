// services/WindowManager.js

const { BrowserWindow, screen, globalShortcut } = require('electron');
const path = require('path');

class WindowManager {
    constructor() {
        this.mainWindow = null;
        this.menuWindow = null;
    }

    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 1200,
            minHeight: 300,
            minWidth: 400,
            frame: false,
            movable: true,
            resizable: true,
            fullscreenable: true,
            icon: path.join(__dirname, '..', 'assets/images/app-logo-nobg.ico'),
            webPreferences: {
                preload: path.join(__dirname, '..', 'preload.js'),
                contextIsolation: true,
                enableRemoteModule: false,
                nodeIntegration: true,
            },
        });

        this.mainWindow.loadFile('launcher.html')
            .catch(err => {
                console.error('Error loading launcher:', err);
            });

        // 設置視窗大小變化監聽
        this.mainWindow.on('resize', () => {
            const { width, height } = this.mainWindow.getBounds();
            this.mainWindow.webContents.send('window-resized', { width, height });
        });

        this.setupDevTools();
        return this.mainWindow;
    }

    createMenuWindow() {
        if (this.menuWindow) {
            return this.menuWindow;
        }

        this.menuWindow = new BrowserWindow({
            width: 165,
            height: 200,
            frame: false,
            transparent: true,
            icon: path.join(__dirname, '..', 'assets/images/app-logo-nobg.ico'),
            fullscreenable: false,
            maximizable: false,
            alwaysOnTop: true,
            resizable: false,
            webPreferences: {
                preload: path.join(__dirname, '..', 'menu-preload.js'),
                nodeIntegration: true,
                contextIsolation: false,
            },
        });

        this.menuWindow.loadFile('menu.html')
            .catch(err => {
                console.error('Error loading menu:', err);
            });

        this.menuWindow.on('closed', () => {
            this.menuWindow = null;
        });

        return this.menuWindow;
    }

    toggleFullscreen() {
        if (!this.mainWindow) return;

        const isMaximized = this.mainWindow.isMaximized();
        if (!isMaximized) {
            this.mainWindow.setFullScreen(false);
            this.mainWindow.setResizable(true);
            this.mainWindow.maximize();
            this.mainWindow.setMenuBarVisibility(false);
        } else {
            this.mainWindow.unmaximize();
            this.mainWindow.setMenuBarVisibility(true);
        }
    }

    setupDevTools() {
        globalShortcut.register('Control+Shift+I', () => {
            if (this.mainWindow) {
                this.mainWindow.webContents.openDevTools({ mode: 'detach' });
            }
        });
    }

    monitorMenuPosition() {
     setInterval(() => {
         if (this.menuWindow) {  // 使用 this.menuWindow 而不是 menuWindow
             const { x, y, width, height } = this.menuWindow.getBounds();
             const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

             // 限制菜單視窗的位置在顯示器邊界內
             const newX = Math.min(Math.max(x, 0), screenWidth - width);
             const newY = Math.min(Math.max(y, 0), screenHeight - height);

             // 如果位置有改變，才更新位置
             if (newX !== x || newY !== y) {
                 this.menuWindow.setBounds({ 
                     x: newX, 
                     y: newY,
                     width,
                     height
                 });
             }
         }
     }, 100);
 }
 

    closeMainWindow() {
        if (this.mainWindow) {
            this.mainWindow.close();
        }
    }

    minimizeMainWindow() {
        if (this.mainWindow) {
            this.mainWindow.minimize();
        }
    }

    closeMenuWindow() {
        if (this.menuWindow) {
            this.menuWindow.close();
        }
    }

    minimizeMenuWindow() {
        if (this.menuWindow) {
            this.menuWindow.minimize();
        }
    }

    // 清理方法
    cleanup() {
        globalShortcut.unregisterAll();
    }
}

module.exports = new WindowManager();