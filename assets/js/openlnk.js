document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fullscreen-btn').addEventListener('click', () => {
        window.electronAPI.fullscreenWindow();
    });
    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });

    document.getElementById('close-btn').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });
});
