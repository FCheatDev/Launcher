const { app } = require('electron');
const path = require('path');

// 獲取應用根目錄 (在打包後使用 userData，開發時使用當前目錄)
const ROOT_PATH = app.isPackaged 
    ? path.join(app.getPath('userData'))
    : path.join(__dirname, '..');

const CONFIG = {
    APP: {
        NAME: 'FCheat Launcher',
        VERSION: '1.0.0',
        ROOT_PATH
    },
    FOLDERS: {
        GAMES: {
            MAIN: path.join(ROOT_PATH, 'Games'),
            SUB: ['Roblox', 'GenshinImpact', 'Minecraft']
        },
        ASSETS: path.join(ROOT_PATH, 'assets')
    },
    EXECUTORS: {
        WAVE: {
            name: 'Wave Executor',
            exePath: path.join(process.env.LOCALAPPDATA, 'Programs', 'Wave', 'Wave.exe'),
            installDir: path.join(process.env.LOCALAPPDATA, 'Programs', 'Wave'),
            downloadUrl: 'https://cdn.getwave.gg/userinterface/Wave-Setup.exe'
        },
        SOLARA: {
            name: 'Solara Executor',
            exePath: path.join(app.getPath('appData'), 'FCheatlauncher', 'Games', 'Roblox', 'Solara', 'Solara-Setup.exe'),
            installDir: path.join(app.getPath('appData'), 'FCheatlauncher', 'Games', 'Roblox', 'Solara'),
            downloadUrl: 'https://f29cc861.solaraweb-alj.pages.dev/download/static/files/Bootstrapper.exe',
            // 添加基礎域名配置
            baseUrl: 'solaraweb-alj.pages.dev',
            downloadPath: '/download/static/files/Bootstrapper.exe'
        },
        ZORARA: {
            name: 'Zorara Executor',
            exePath: path.join(app.getPath('appData'), 'FCheatlauncher', 'Games', 'Roblox', 'Zorara', 'Zorara.exe'),
            installDir: path.join(app.getPath('appData'), 'FCheatlauncher', 'Games', 'Roblox', 'Zorara')
        },
        CLOUDY: {
            name: 'Cloudy Executor',
            exePath: path.join(app.getPath('appData'), 'FCheatlauncher', 'Games', 'Roblox', 'Cloudy', 'Cloudy-Setup.exe'),
            installDir: path.join(app.getPath('appData'), 'FCheatlauncher', 'Games', 'Roblox', 'Cloudy'),
            downloadUrl: 'https://github.com/cloudyExecutor/webb/releases/download/alpha/CloudyBootstrapInstaller.exe'
        },
        LUNA: {
            name: 'Luna Executor',
            exePath: path.join(app.getPath('appData'), 'FCheatlauncher', 'Games', 'Roblox', 'Luna', 'Luna-Setup.exe'),
            installDir: path.join(app.getPath('appData'), 'FCheatlauncher', 'Games', 'Roblox', 'Luna'),
            downloadUrl: 'https://github.com/suffz/luna/raw/refs/heads/main/Bootstrapper.zip'
        }
    },
    PATHS: {
        UPDATES: path.join(ROOT_PATH, 'updates'),
        PACKAGE: app.isPackaged
            ? path.join(process.resourcesPath, 'app.asar/package.json')
            : path.join(__dirname, '../..', 'package.json'),
        PRELOAD: app.isPackaged
            ? path.join(process.resourcesPath, 'app.asar/preload.js')
            : path.join(__dirname, '../..', '/preload.js')
    },

    WINDOW: {
        MAIN: {
            DEFAULT_SIZE: {
                width: 1400,
                height: 1200,
                minHeight: 598,
                minWidth: 753
            },
            ICON: app.isPackaged
                ? path.join(process.resourcesPath, 'images/app-logo-nobg.ico')
                : path.join(__dirname, '..', 'images/app-logo-nobg.ico')
        },
        MENU: {
            DEFAULT_SIZE: {
                width: 165,
                height: 200
            },
            ICON: app.isPackaged
                ? path.join(process.resourcesPath, 'images/app-logo-nobg.ico')
                : path.join(__dirname, '..', 'images/app-logo-nobg.ico')
        }
    },

    AD_BLOCK: {
        RULES: [
            '*://*.doubleclick.net/*',
            '*://*.googlesyndication.com/*',
            '*://*.adservice.google.com/*',
            '*://*.ads.yahoo.com/*',
            '*://*.adnxs.com/*',
            '*://*/*.ads/*',
            '*://*/*popup*',
            '*://*/*.ad',
        ]
    },

    UPDATE: {
        REPO: 'FCheatDev/Launcher',
        CHECK_INTERVAL: 1000 * 60 * 60 // 1 hour
    },

    LOGGER: {
        // 日誌文件設置
        MAX_FILE_SIZE: 5242880, // 5MB
        MAX_FILES: 5,
        DAYS_TO_KEEP: 30,
        
        // 日誌類別
        CATEGORIES: {
            SYSTEM: 'SYSTEM',      // 系統相關日誌
            WINDOW: 'WINDOW',      // 窗口相關日誌
            UPDATE: 'UPDATE',      // 更新相關日誌
            IPC: 'IPC',           // IPC通信相關日誌
            ADBLOCK: 'ADBLOCK',    // 廣告攔截相關日誌
            FOLDER: 'FOLDER',      // 文件夾操作相關日誌
            EXEC: 'EXEC',          // 執行文件相關日誌
            ERROR: 'ERROR'         // 錯誤相關日誌
        },

        // 日誌級別
        LEVELS: {
            ERROR: 'error',
            WARN: 'warn',
            INFO: 'info',
            DEBUG: 'debug'
        },

        // 日誌文件
        FILES: {
            ERROR: 'error.log',
            COMBINED: 'combined.log',
            SYSTEM: 'system.log',
            DEBUG: 'debug.log'
        },

        // 日誌格式設置
        FORMAT: {
            TIMESTAMP: 'YYYY-MM-DD HH:mm:ss.SSS'
        }
    }
};

module.exports = CONFIG;