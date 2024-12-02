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
    try {
        const button = document.getElementById(`find-${type}`);
        if (!button) return;

        button.disabled = true;
        button.textContent = "搜尋中...";
        button.style.backgroundColor = "#496afc";
        
        showToast('search');

        const isFound = await window.gameAPI.checkInstalled(type);
        
        if (isFound) {
            showToast('success');
            setTimeout(() => {
                button.textContent = "啟動";
                button.style.backgroundColor = "#70fff8";
                button.disabled = false;
            }, 1000);
        } else {
            showToast('error');
            setTimeout(() => {
                button.textContent = "尋找";
                button.style.backgroundColor = "#70fff8";
                button.disabled = false;
            }, 1000);
        }
    } catch (error) {
        console.error(`Error handling ${type}:`, error);
        showToast('default');
        button.textContent = "尋找";
        button.style.backgroundColor = "#70fff8";
        button.disabled = false;
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
});

// 導出函數
window.handleExecutorAction = handleExecutorAction;