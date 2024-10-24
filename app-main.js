const { app, BrowserWindow, ipcMain, shell, globalShortcut ,screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let menuWindow = null;

function createWindow() {
    // 創建主視窗
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1200,
        frame: false,
        movable: true,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, 'images/app-logo.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: true
        },
    });
    ipcMain.on('open-external-link', (event, url) => {
        shell.openExternal(url);
    });
    // 加载 HTML 文件
    mainWindow.loadFile('launcher.html').catch(err => {
        console.error('加载 HTML 文件时发生错误:', err);
    });

    // 禁止最大化
    mainWindow.on('maximize', () => {
        mainWindow.unmaximize();
    });

    // 監聽縮小與關閉按鈕的事件
    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });

    // 創建菜單視窗
    createMenuWindow();

    // 註冊全局快捷鍵
    globalShortcut.register('Control+Shift+I', () => {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
}


// 監聽按鈕點擊事件
ipcMain.on('open-menu-window', () => {
    if (!menuWindow) {  // 如果菜單窗口還未打開
        createMenuWindow();
    }
});
// 创建菜單視窗
function createMenuWindow() {
    menuWindow = new BrowserWindow({
        width: 165,
        height: 200,
        frame: false,
        transparent: true,
        fullscreenable: false, 
        maximizable: false,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 加载菜单 HTML 文件
    menuWindow.loadFile('menu.html').catch(err => {
        console.error('加载菜单文件时发生错误:', err);
    });
    // 監聽關閉菜單窗口的請求
    ipcMain.on('close-menu-window', () => {
        if (menuWindow) {
            menuWindow.close();
        }
    });

    // 在關閉時將 `menuWindow` 設置為 `null`
    menuWindow.on('closed', () => {
        menuWindow = null;
    });
    // 禁止最大化
    mainWindow.on('maximize', () => {
        mainWindow.unmaximize();
    });
    ipcMain.on('return-home', () => {
        mainWindow.loadFile('launcher.html'); // 替换为您的首页路径
    });
}

app.whenReady().then(() => {
    createWindow();
    // 獲取主顯示器資訊
    const primaryDisplay = screen.getPrimaryDisplay();
    console.log(primaryDisplay);
    // 每 0.1 秒偵測一次菜單窗口的位置並進行調整
    setInterval(() => {
        if (menuWindow) {
            const { x, y } = menuWindow.getBounds();
            const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

            // 檢查菜單窗口是否超出顯示器的邊界
            if (x + menuWindow.getBounds().width > screenWidth) {
                menuWindow.setBounds({ x: x - 100, y });
            }
            if (y + menuWindow.getBounds().height > screenHeight) {
                menuWindow.setBounds({ x, y: y - 100 });
            }
            if (x < 0) {
                menuWindow.setBounds({ x: x + 100, y });
            }
            if (y < 0) {
                menuWindow.setBounds({ y: y + 100, x });
            }
            //console.log(`Menu current position - X: ${x}, Y: ${y}`); //Debug Menu
        }
    }, 100); // 每 0.1 秒更新一次
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});



// 確保文件夾存在，若不存在則創建
const programFilesPath = process.env.PROGRAMFILES || process.env.ProgramFiles;
const launcherDir = path.join(programFilesPath, 'FCheatLauncher');
const filePath = path.join(launcherDir, 'launcher_path.txt');

if (!fs.existsSync(launcherDir)) {
    fs.mkdirSync(launcherDir, { recursive: true });
}

const launcherPath = app.getPath('exe');

fs.promises.writeFile(filePath, launcherPath, 'utf-8')
    .then(() => {
        console.log('File Save on:', filePath);
    })
    .catch(err => {
        console.error('error:', err);
    });
