const fs = require('fs');
const path = require('path');
const { shell } = require('electron');
const { ipcMain } = require('electron');

// 定义游戏目录路径
const GamesMinecraftDir = path.join('C:', 'Program Files', 'FCheatLauncher', 'Games', 'Minecraft');
const GamesRobloxDir = path.join('C:', 'Program Files', 'FCheatLauncher', 'Games', 'Roblox');
const GamesGenshinImpactDir = path.join('C:', 'Program Files', 'FCheatLauncher', 'Games', 'GenshinImpact');
const GamesDir = path.join('C:', 'Program Files', 'FCheatLauncher', 'Games');

// 函数：创建目录并打开
function createAndOpenDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`文件夹已创建: ${dirPath}`);
    } else {
        console.log(`文件夹已存在: ${dirPath}`);
    }

    // 打开目录
    shell.openPath(dirPath)
        .then(() => {
            console.log(`已打开文件夹: ${dirPath}`);
        })
        .catch(err => {
            console.error(`无法打开文件夹: ${dirPath}`, err);
        });
}

// IPC 处理
ipcMain.on('request-games-dir', (event) => {
    event.reply('response-games-dir', GamesDir); // 将 GamesDir 发送回渲染进程
});
