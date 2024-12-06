const sidebar = document.querySelector(".sidebar");
const closeBtn = document.querySelector("#btn");
const navList = document.querySelector(".nav-list");

closeBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    navList.classList.toggle("scroll");
    menuBtnChange();
});

function menuBtnChange() {
    if (sidebar.classList.contains("open")) {
        closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");
    } else {
        closeBtn.classList.replace("bx-menu-alt-right", "bx-menu");
    }
}

// 執行器處理功能
async function handleExecutorAction(type) {
    const button = document.getElementById(`find-${type}`);
    if (!button || button.disabled) return;

    try {
        button.disabled = true;
        button.style.backgroundColor = "#70fff8";
        button.textContent = "檢查中...";
        
        // 檢查安裝
        const result = await window.gameAPI.checkInstalled(type.toUpperCase());
        
        if (result.exists) {
            // 如果已安裝，顯示檢驗信息並啟動
            showToast('success', '', {
                title: '檔案檢驗',
                message: '已安裝,正在啟動'
            });
            
            try {
                await window.gameAPI.launch(type.toUpperCase());
                button.textContent = "啟動";
            } catch (error) {
                console.error(`Launch error for ${type}:`, error);
                showToast('error', '', 'LAUNCH_FAILED');
                button.textContent = "啟動";
            }
        } else {
            // 如果未安裝，開始下載安裝流程
            button.textContent = "下載中...";
            try {
                const filePath = await window.gameAPI.downloadExecutor(type.toUpperCase());
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                await window.gameAPI.launch(type.toUpperCase());
                showToast('success', filePath);
                button.textContent = "啟動";
            } catch (error) {
                console.error(`Installation error for ${type}:`, error);
                showToast('error', '', 'INSTALLATION_FAILED');
                button.textContent = "安裝";
            }
        }
    } catch (error) {
        console.error(`Error handling ${type}:`, error);
        if (button) {
            button.textContent = "安裝";
            showToast('error', '', 'INSTALLATION_FAILED');
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.style.backgroundColor = "#70fff8";
        }
    }
}
// 為每個執行器卡片初始化點擊事件
function setupExecutorCards() {
    const cards = document.querySelectorAll('.fc_games.card');
    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.trim();
        if (!title) return;

        // 排除 FCheat Executor，因為尚未實現
        if (title === 'FCheat Executor') return;

        const type = title.split(' ')[0].toLowerCase();
        
        let button = card.querySelector('button');
        if (!button) {
            button = document.createElement('button');
            button.id = `find-${type}`;
            const lastChild = card.lastChild;
            if (lastChild.nodeType === Node.TEXT_NODE) {
                card.removeChild(lastChild);
            }
            card.appendChild(button);
        }

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            handleExecutorAction(type);
        });

        checkExecutorStatus(type, button);
    });
}
// 初始化所有執行器
function initializeExecutors() {
    const executors = ['wave', 'solara', 'zorara', 'cloudy', 'luna'];
    
    for (const type of executors) {
        const button = document.getElementById(`find-${type}`);
        if (button) {
            checkExecutorStatus(type, button);
        }
    }
}

// 檢查執行器狀態
async function checkExecutorStatus(type, button) {
    try {
        const status = await window.gameAPI.checkInstalled(type.toUpperCase());
        button.textContent = status.exists ? "啟動" : "安裝";
        button.style.backgroundColor = "#70fff8";
    } catch (error) {
        console.error(`Error checking ${type} status:`, error);
        button.textContent = "安裝";
        button.style.backgroundColor = "#70fff8";
    }
}

// 淡入效果
function initializeFadeEffects() {
    const textElements = document.querySelectorAll(".fade-text");
    let delay = 300;

    textElements.forEach((element) => {
        setTimeout(() => {
            element.classList.add("fade-in");
        }, delay);
        delay += 100;
    });
}

// 頁面載入初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeFadeEffects();
    initializeExecutors();
    setupExecutorCards();
});

// 導出函數
window.handleExecutorAction = handleExecutorAction;