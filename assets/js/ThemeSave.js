let currentTheme = 'dark'; // 默認主題

// 應用主題到整個應用程式
function applyTheme(theme, isPermanent = false) {
     document.body.classList.forEach(className => {
         if (className.startsWith('theme-')) {
             document.body.classList.remove(className);
         }
     });
     
     document.body.classList.add(`theme-${theme}`);
     
    
    // 特殊主題的額外處理
    if (theme === 'space' || theme === 'cyberpunk') {
     document.body.classList.add('theme-special');
 }
 
 if (isPermanent) {
     currentTheme = theme;
     localStorage.setItem('fcheat-theme', theme);
     window.themeAPI.changeTheme(theme);
 }
}
// 初始化主題
async function initializeTheme() {
try {
     // 獲取初始主題
     const initialTheme = await window.themeAPI.getInitialTheme();
     currentTheme = initialTheme;
     applyTheme(initialTheme, true);

     // 如果在主題設定頁面，更新選中狀態
     const selectedCard = document.querySelector(`[data-theme="${initialTheme}"]`);
     if (selectedCard) {
          selectedCard.classList.add('selected');
     }
} catch (error) {
     console.error('Failed to initialize theme:', error);
}
}

// 當頁面加載完成時初始化主題
window.addEventListener('load', initializeTheme);

// 監聽來自其他視窗的主題變更
window.themeAPI.onThemeChange((theme) => {
currentTheme = theme;
applyTheme(theme, false);

// 更新主題卡片選中狀態（如果在主題設定頁面）
const themeCards = document.querySelectorAll('.theme-card');
themeCards.forEach(card => {
     card.classList.toggle('selected', card.dataset.theme === theme);
});
});

// 如果是主題設定頁面，設置主題卡片事件
const themeCards = document.querySelectorAll('.theme-card');
if (themeCards.length > 0) {
themeCards.forEach(card => {
     const theme = card.dataset.theme;
     
     // 懸停效果 - 預覽主題
     card.addEventListener('mouseenter', () => {
          themeCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          applyTheme(theme, false);
     });

     // 移開效果 - 恢復原主題
     card.addEventListener('mouseleave', () => {
          themeCards.forEach(c => c.classList.remove('selected'));
          document.querySelector(`[data-theme="${currentTheme}"]`)?.classList.add('selected');
          applyTheme(currentTheme, false);
     });

     // 點擊選擇主題 - 永久套用
     card.addEventListener('click', () => {
          themeCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          applyTheme(theme, true);
     });
});
}
