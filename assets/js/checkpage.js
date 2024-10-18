// checkpage.js

function navigateToPage(page) {
    const pages = ['../../launcher.html', 'games.html', 'settings.html', 'roblox.html']; // 可访问的页面列表
    if (pages.includes(page)) {
        window.location.href = page; // 正常跳转
    } else {
        window.location.href = '../Error404/404.html'; // 跳转到 404 页面
    }
}

// 让函数可以在全局范围内访问
window.navigateToPage = navigateToPage;
