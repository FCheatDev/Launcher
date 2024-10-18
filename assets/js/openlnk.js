document.addEventListener('DOMContentLoaded', () => {
    const openLinkBtn = document.getElementById('open-link');
    if (openLinkBtn) {
        openLinkBtn.onclick = function(event) {
            event.preventDefault(); // 防止默认行为
            const url = 'https://discord.gg/5jfNJt4FMQ'; // 替换为你要打开的 URL
            console.log('Clicked link, trying to open:', url); // 添加这一行
            window.electron.openExternalLink(url); // 调用暴露的方法
        };
    }

    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });

    document.getElementById('close-btn').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });
});
