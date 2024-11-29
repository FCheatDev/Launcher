// assets/service/DependencyChecker.js
const { app, dialog, shell } = require('electron');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs-extra');
const logger = require('./logger');

const execAsync = util.promisify(exec);

class DependencyChecker {
    constructor() {
        logger.system('Initializing DependencyChecker');
        this.requiredDependencies = [
            {
                name: 'Visual C++ Runtime 2015-2022',
                downloadUrl: 'https://aka.ms/vs/17/release/vc_redist.x64.exe',
                description: '運行 Electron 和 Node.js 原生模組所需',
                checkCommands: [
                    'reg query "HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64" /v Version',
                    'reg query "HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x86" /v Version',
                    'if exist "%SystemRoot%\\System32\\vcruntime140.dll" echo Found'
                ],
                required: true
            },
            {
                name: '7-Zip',
                downloadUrl: 'https://7-zip.org/a/7z2301-x64.exe',
                description: '用於處理壓縮文件',
                checkCommands: [
                    'reg query "HKLM\\SOFTWARE\\7-Zip" /ve',
                    'if exist "%ProgramFiles%\\7-Zip\\7z.exe" echo Found',
                    'if exist "%ProgramFiles(x86)%\\7-Zip\\7z.exe" echo Found'
                ],
                required: false
            }
        ];
        logger.system('DependencyChecker initialized with dependencies:', {
            dependencies: this.requiredDependencies.map(d => d.name)
        });
    }

    /**
     * 檢查單個依賴項是否已安裝
     */
    async checkDependency(dependency) {
        logger.system(`Checking dependency: ${dependency.name}`);
        try {
            for (const command of dependency.checkCommands) {
                try {
                    logger.system(`Running check command for ${dependency.name}:`, { command });
                    await execAsync(command);
                    logger.system(`Dependency ${dependency.name} found through command: ${command}`);
                    return true;
                } catch (error) {
                    logger.system(`Command failed for ${dependency.name}:`, { 
                        command, 
                        error: error.message 
                    });
                    continue;
                }
            }
            logger.system(`Dependency ${dependency.name} not found`);
            return false;
        } catch (error) {
            logger.error(`Error checking dependency ${dependency.name}:`, error);
            return false;
        }
    }

    /**
     * 檢查所有必需的依賴項
     */
    async checkAllDependencies() {
        logger.system('Starting dependency check');
        const missingDeps = [];

        for (const dep of this.requiredDependencies) {
            if (dep.required) {
                const isInstalled = await this.checkDependency(dep);
                logger.system(`Dependency status:`, {
                    name: dep.name,
                    installed: isInstalled,
                    required: dep.required
                });
                
                if (!isInstalled) {
                    missingDeps.push(dep);
                }
            }
        }

        if (missingDeps.length > 0) {
            logger.system('Missing dependencies found:', {
                count: missingDeps.length,
                missing: missingDeps.map(d => d.name)
            });
            await this.handleMissingDependencies(missingDeps);
            return false;
        }

        logger.system('All required dependencies are installed');
        return true;
    }

    /**
     * 處理缺失的依賴項
     */
    async handleMissingDependencies(missingDeps) {
        logger.system('Handling missing dependencies', {
            dependencies: missingDeps.map(d => d.name)
        });

        const depList = missingDeps.map(dep => `- ${dep.name}\n  ${dep.description}`).join('\n');
        const message = `檢測到缺少以下必需組件：\n\n${depList}\n\n點擊確定將自動打開下載頁面。`;

        const result = await dialog.showMessageBox({
            type: 'warning',
            title: '缺少必需組件',
            message: message,
            buttons: ['下載並安裝', '退出'],
            defaultId: 0,
            cancelId: 1
        });

        logger.system('User response to missing dependencies dialog:', {
            response: result.response
        });

        if (result.response === 0) {
            for (const dep of missingDeps) {
                logger.system(`Opening download URL for ${dep.name}:`, {
                    url: dep.downloadUrl
                });
                await shell.openExternal(dep.downloadUrl);
            }

            await dialog.showMessageBox({
                type: 'info',
                title: '安裝說明',
                message: '請按順序安裝所有組件。\n安裝完成後請重新啟動應用程序。',
                buttons: ['確定']
            });
        }

        logger.system('Application will quit due to missing dependencies');
        app.quit();
    }

    /**
     * 檢查管理員權限
     */
    async checkAdminRights() {
        logger.system('Checking administrator rights');
        if (process.platform === 'win32') {
            try {
                await execAsync('net session');
                logger.system('Administrator rights verified');
                return true;
            } catch (error) {
                logger.system('Administrator rights check failed:', {
                    error: error.message
                });
                
                await dialog.showMessageBox({
                    type: 'warning',
                    title: '權限不足',
                    message: '此應用程序需要管理員權限才能運行。\n請右鍵點擊應用程序，選擇"以管理員身份運行"。',
                    buttons: ['確定']
                });

                logger.system('Application will quit due to insufficient privileges');
                app.quit();
                return false;
            }
        }
        return true;
    }

    /**
     * 處理運行時錯誤
     */
    async handleRuntimeError(error) {
        logger.error('Runtime error occurred:', {
            error: error.message,
            stack: error.stack
        });

        let errorType = 'unknown';
        let solution = '';

        if (error.message.includes('VCRUNTIME') || error.message.includes('.dll')) {
            errorType = 'system_components';
            solution = '需要安裝 Visual C++ Runtime';
            logger.system('Detected missing Visual C++ Runtime');
            await this.handleMissingDependencies([this.requiredDependencies[0]]);
        } else if (error.message.includes('EPERM') || error.message.includes('Access is denied')) {
            errorType = 'permissions';
            logger.system('Detected permission error');
            await this.checkAdminRights();
        } else {
            logger.system('Unhandled error type:', {
                type: errorType,
                message: error.message
            });
            
            await dialog.showMessageBox({
                type: 'error',
                title: '運行錯誤',
                message: `發生未知錯誤：${error.message}`,
                buttons: ['確定']
            });
            
            app.quit();
        }
    }
}

module.exports = new DependencyChecker();