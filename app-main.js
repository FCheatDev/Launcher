const { app, BrowserWindow, ipcMain, shell, globalShortcut, screen, dialog, webRequest, session } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { spawn } = require('child_process');
const { execFile } = require('child_process');



/*-----------------------------------參數 -------------------------------------------------*/ 

let adBlockEnabled = false;
let mainWindow;
let menuWindow = null;
let isUpdateAvailable = false;
let solaraInstances = 0;
let waveInstances = 0;
let zoraraInstances = 0;




const maxInstances = 1; 
const ConfigMainFolder = path.join(__dirname, 'Config');
const GamesMainFolder = './Games';
const GamesSubFolders = ['Roblox', 'GenshinImpact', 'Minecraft'];
const currentVersion = '0.0.0'; 
const installPath = path.join(app.getPath('userData'), 'updates');
const SearchSolara = path.join(__dirname, 'assets/get-files/roblox/get_solara_exec_path.exe');
const SearchWave = path.join(__dirname, 'assets/get-files/roblox/get_wave_exec_path.exe');
const SearchZorara = path.join(__dirname, 'assets/get-files/roblox/get_zorara_exec_path.exe');
/*-----------------------------------創建主視窗 -------------------------------------------------*/ 
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1200,
        minHeight: 300,
        minWidth:400,
        frame: false,
        movable: true,
        resizable:true,
        fullscreenable: true, 
        icon: path.join(__dirname, 'assets/images/app-logo-nobg.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: true,
        },
    });

    mainWindow.loadFile('launcher.html').catch(err => {
        console.error('Error loading HTML file:', err);
    });
    mainWindow.on('resize', () => {
        const { width, height } = mainWindow.getBounds();
        //console.log(`Current window size: ${width}x${height}`);
    });

    // 註冊全局快捷鍵
    globalShortcut.register('Control+Shift+I', () => {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    });

    // 建立菜單視窗
    createMenuWindow();
}
/*-----------------------------------創建菜單視窗 -------------------------------------------------*/ 
function createMenuWindow() {
    menuWindow = new BrowserWindow({
        width: 165,
        height: 200,
        frame: false,
        transparent: true,
        icon: path.join(__dirname, 'assets/images/app-logo-nobg.ico'),
        fullscreenable: false,
        maximizable: false,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    menuWindow.loadFile('menu.html').catch(err => {
        console.error('Error loading menu file:', err);
    });

    menuWindow.on('closed', () => {
        menuWindow = null;
    });
}
/*-----------------------------------設定 IPC 事件處理邏輯 -------------------------------------------------*/ 
function setupIpcHandlers() {
    ipcMain.on('minimize-window', () => mainWindow.minimize());
    ipcMain.on('close-window', () => mainWindow.close());
    ipcMain.on('open-menu-window', () => {if (!menuWindow) createMenuWindow();});
    ipcMain.on('close-menu-window', () => {if (menuWindow) menuWindow.close();});
    ipcMain.on('minimize-menu-window', () => menuWindow.minimize());
    
    ipcMain.on('return-home', () => mainWindow.loadFile('launcher.html'));
    ipcMain.on('open-external-link', (event, url) => shell.openExternal(url));
    ipcMain.on('toggle-ad-blocking', (event, shouldEnable) => {adBlockEnabled = shouldEnable;  setupAdBlock(); const message = adBlockEnabled ? "廣告攔截已啟用" : "廣告攔截已禁用";event.reply('ad-block-status', message); });
    ipcMain.on('toggle-fullscreen', () => {if (mainWindow) {const isMaximized = mainWindow.isMaximized();if (!isMaximized) {mainWindow.setFullScreen(false);  mainWindow.setResizable(true); mainWindow.maximize();mainWindow.setMenuBarVisibility(false); } else { mainWindow.unmaximize();mainWindow.setMenuBarVisibility(true);}}}); 
    mainWindow.on('resize', () => {const { width, height } = mainWindow.getBounds();/*console.log(`Current window size: ${width}x${height}`);*/mainWindow.webContents.send('window-resized', { width, height });});
 ipcMain.on('run-find-solara', () => {
    if (solaraInstances >= maxInstances) {
        dialog.showMessageBoxSync({
            type: 'error',
            title: '外掛查找系統',
            message: 'Solara Executror 查找過多,請等待當前查找系統查找完再執行'
        });
        return;
    }
    
    const process = spawn(SearchSolara);
    solaraInstances++; // 增加solara实例计数

    process.on('exit', () => {
        solaraInstances--; // 当进程退出时减少计数
    });
});

ipcMain.on('run-find-wave', () => {
    if (waveInstances >= maxInstances) {
        dialog.showMessageBoxSync({
            type: 'error',
            title: '外掛查找系統',
            message: 'Wave Executror 查找過多,請等待當前查找系統查找完再執行'
        });
        return;
    }
    
    const process = spawn(SearchWave);
    waveInstances++; // 增加wave实例计数

    process.on('exit', () => {
        waveInstances--; // 当进程退出时减少计数
    });
});

ipcMain.on('run-find-zorara', () => {
    if (zoraraInstances >= maxInstances) {
        dialog.showMessageBoxSync({
            type: 'error',
            title: '外掛查找系統',
            message: 'Zorara Executror 查找過多,請等待當前查找系統查找完再執行'
        });
        return;
    }
    
    const process = spawn(SearchZorara);
    zoraraInstances++; // 增加zorara实例计数

    process.on('exit', () => {
        zoraraInstances--; // 当进程退出时减少计数
    });
});





}

/*-----------------------------------初始化並檢測菜單視窗的位置 -------------------------------------------------*/ 
function monitorMenuPosition() {
    setInterval(() => {
        if (menuWindow) {
            const { x, y, width, height } = menuWindow.getBounds();
            const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

            // 限制菜單視窗的位置在顯示器邊界內
            const newX = Math.min(Math.max(x, 0), screenWidth - width);
            const newY = Math.min(Math.max(y, 0), screenHeight - height);
            if (newX !== x || newY !== y) menuWindow.setBounds({ x: newX, y: newY });
        }
    }, 100);
}


/*-----------------------------------初始化遊戲安裝資料夾 -------------------------------------------------*/ 
function CreateGamesFolders(){
    // 創建主資料夾 "Games"
    console.log('----------- Create Games Folder Log-----------');
    if (!fs.existsSync(GamesMainFolder)) {
    fs.mkdirSync(GamesMainFolder);
    console.log('Games Folder created');
    } else {
    console.log('Games folder already exists');
    }

    // 創建子資料夾
    GamesSubFolders.forEach(subFolder => {
    const GameSubFolderPath = path.join(GamesMainFolder, subFolder);
    
    if (!fs.existsSync(GameSubFolderPath)) {
        fs.mkdirSync(GameSubFolderPath);
        console.log(`${subFolder} Folder created`);
    } else {
        console.log(`${subFolder} folder already exists`);
    }
    });
}
/*-----------------------------------初始化配置安裝資料夾 -------------------------------------------------*/ 
function CreateConfigFolders() {
    // 創建主資料夾 "Config"
    console.log('----------- Create Config Folder Log -----------');
    if (!fs.existsSync(ConfigMainFolder)) {
        fs.mkdirSync(ConfigMainFolder, { recursive: true }); // 確保創建 Config 資料夾
        console.log('Config Folder created');
    } else {
        console.log('Config folder already exists');
    }
}
/*-----------------------------------獲取版本號 -------------------------------------------------*/
function getLocalVersion() {
    const packagePath = path.join(__dirname, 'package.json'); // 指定package.json路径
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')); // 读取并解析JSON
    return packageJson.version; // 返回版本号
}
console.log('-----------Version Log-----------');
const localVersion = getLocalVersion();
console.log(`Current Version: ${localVersion}`);
/*-----------------------------------ADBLOCK -------------------------------------------------*/
function setupAdBlock() {
    const adBlockList = [
        '*://*.doubleclick.net/*',
        '*://*.googlesyndication.com/*',
        '*://*.adservice.google.com/*',
        '*://*.ads.yahoo.com/*',
        '*://*.adnxs.com/*',
        '*://*/*.ads/*',
        '*://*/*popup*',
        '*://*/*.ad',
    ];

    // 清除之前的攔截器，以免重複設置
    session.defaultSession.webRequest.onBeforeRequest(null);

    // 判斷廣告攔截是否啟用
    if (adBlockEnabled) {
        session.defaultSession.webRequest.onBeforeRequest({ urls: adBlockList }, (details, callback) => {
            // 僅攔截廣告相關的外部連結請求
            callback({ cancel: true }); // 取消匹配的請求
        });

        dialog.showMessageBoxSync({
            type: 'info',
            title: '廣告攔截器',
            message: '廣告攔截已啟用。此功能還在開發中,只能擋掉一小部分'
        });
    } else {
        dialog.showMessageBoxSync({
            type: 'info',
            title: '廣告攔截器',
            message: '廣告攔截已禁用'
        });
    }
}
// 控制按鈕開關 adBlockEnabled 狀態，並重新加載攔截器
function toggleAdBlock() {
    adBlockEnabled = !adBlockEnabled;
    setupAdBlock();
}
/*-----------------------------------DOWNLOAD AND UPDATE APP -------------------------------------------------*/
async function checkForUpdates() {
    console.log('-----------Checking updates Log-----------');
    try {
        const response = await axios.get('https://api.github.com/repos/FCheatDev/Launcher/releases/latest');
        const latestRelease = response.data;
        const latestVersion = latestRelease.tag_name; // 例如 '1.1.1'
        const remoteVersion = latestVersion.replace('v', ''); // 去掉版本前的 'v'

        if (remoteVersion > localVersion) {
            console.log(`There is a new version: ${latestVersion}, prompting user...`);
            isUpdateAvailable = true; // 设置标志位为 true

            // 弹出对话框
            const result = await dialog.showMessageBox(mainWindow, {
                type: 'info',
                buttons: ['更新'],
                title: '發現新版本',
                message: `新版本: ${latestVersion}`,
            });

            await dialog.showMessageBox(mainWindow, {
                type: 'info',
                buttons: ['確定'],
                title: 'INFO',
                message: `請等待,APP正在更新....`,
            });

            // 当用户点击“更新”按钮时执行下载逻辑
            if (result.response === 0) { // 0 表示“更新”按钮
                await downloadAndUpdate(latestRelease);
            }
        } else {
            console.log('No update available.');
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}
// 下载和更新的逻辑提取到一个新的函数中
async function downloadAndUpdate(latestRelease) {
    const asset = latestRelease.assets.find(asset => asset.name.endsWith('.exe'));
    if (asset) {
        const downloadUrl = asset.browser_download_url;

        if (!fs.existsSync(installPath)) {
            fs.mkdirSync(installPath);
        }

        const filePath = path.join(installPath, asset.name);
        const writer = fs.createWriteStream(filePath);

        const response = await axios.get(downloadUrl, { responseType: 'stream' });
        response.data.pipe(writer);

        writer.on('finish', () => {
            console.log('Download completed, start update...');

            const updateProcess = spawn(filePath, { detached: true, shell: true });

            updateProcess.on('error', (error) => {
                console.error('Error launching the update:', error);
            });

            updateProcess.on('exit', (code) => {
                console.log(`Update process exited with code: ${code}`);
            });

            updateProcess.unref(); // 允许主进程继续执行
            app.quit(); // 结束主进程
        });

        writer.on('error', (error) => {
            console.error('Download failed:', error);
        });
    } else {
        console.log('No .exe file found in the latest release.');
    }
}
/*-----------------------------------初始化應用 -------------------------------------------------*/
app.whenReady().then(async () => {
    await checkForUpdates(); // 等待更新检查完成

    if (!isUpdateAvailable) { // 只有在没有更新的情况下才执行以下操作
        createWindow();
        setupIpcHandlers();
        monitorMenuPosition();
        CreateGamesFolders();
        CreateConfigFolders();
    }
    console.log('-----------Other Log-----------');
});
// 註銷所有全局快捷鍵
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
