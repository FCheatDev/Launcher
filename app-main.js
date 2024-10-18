const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const mainWindow = new BrowserWindow({
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
            nodeIntegration: false
        },
    });

    // 加载 HTML 文件
    mainWindow.loadFile('launcher.html').catch(err => {
        console.error('加载 HTML 文件时发生错误:', err);
    });
    // 监听窗口最大化事件，强制取消最大化
    mainWindow.on('maximize', () => {
        mainWindow.unmaximize();
    });
    // 監聽縮小與關閉按鈕的事件
    ipcMain.on('open-external-link', (event, url) => {
        console.log('Received request to open external link:', url); // 确认是否接收到请求
        shell.openExternal(url);
    });

    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });

    // 註冊全局快捷鍵
    globalShortcut.register('Control+Shift+I', () => {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 在應用退出時取消全局快捷鍵
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// 確保文件夾存在，若不存在則創建
const programFilesPath = process.env.PROGRAMFILES || process.env.ProgramFiles; // 获取 Program Files 路径
const launcherDir = path.join(programFilesPath, 'FCheatLauncher'); // 文件夹路径
const filePath = path.join(launcherDir, 'launcher_path.txt'); // 文件路径

// 创建文件夹
if (!fs.existsSync(launcherDir)) {
    fs.mkdirSync(launcherDir, { recursive: true });
}

// 寻找可执行文件的正确路径
const launcherPath = app.getPath('exe');

// 将路径写入文件
fs.promises.writeFile(filePath, launcherPath, 'utf-8') // 指定编码为 UTF-8
    .then(() => {
        console.log('File Save on:', filePath);
    })
    .catch(err => {
        console.error('error:', err);
    });
