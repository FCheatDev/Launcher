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

        // 如果按鈕文字是"啟動"，代表是已安裝狀態
        if (button.textContent === "啟動") {
            button.disabled = true;
            button.textContent = "啟動中...";
            
            try {
                await window.gameAPI.launch(type);
                showToast('success');
            } catch (error) {
                showToast('error');
            }
            
            button.textContent = "啟動";
            button.disabled = false;
            return;
        }

        // 執行尋找流程
        button.disabled = true;
        button.textContent = "搜尋中...";
        
        // 顯示搜尋中提示
        showToast('search');

        const result = await window.gameAPI.checkInstalled(type);
        
        if (result.exists) {
            showToast('success', result.path); // 傳入路徑
            button.textContent = "啟動";
            button.style.backgroundColor = "#70fff8";
        } else {
            showToast('error');
            button.textContent = "尋找";
            button.style.backgroundColor = "#70fff8";
        }
        button.disabled = false;

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
// 初始化按鈕外觀
function initializeExecutors() {
  const executors = ['wave', 'solara', 'zorara'];
  
  for (const type of executors) {
      const button = document.getElementById(`find-${type}`);
      if (button) {
          button.textContent = "尋找";
          button.style.backgroundColor = "#70fff8";
      }
  }
}

// 頁面載入初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeFadeEffects();
});

// 導出函數
window.handleExecutorAction = handleExecutorAction;