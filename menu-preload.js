const { ipcRenderer } = require('electron');

// 暴露功能到渲染進程
window.menuAPI = {
    closeMenu: () => ipcRenderer.send('close-menu-window')
};
