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
        if (!button || button.disabled) return;

        button.disabled = true;

        if (type === 'solara') {
            button.textContent = "下載中...";
            try {
                const filePath = await window.gameAPI.downloadExecutor(type);
                showToast('success', filePath);
                await window.gameAPI.launch(type);
                button.textContent = "啟動";
            } catch (error) {
                showToast('error');
                button.textContent = "安裝";
            }
            button.disabled = false;
            return;
        }

        // Wave 處理
        const result = await window.gameAPI.checkInstalled(type);
        
        if (result.exists) {
            showToast('success', result.path);
            await window.gameAPI.launch(type);
            button.textContent = "啟動";
        } else {
            showToast('error');
            button.textContent = "安裝";
        }

        button.style.backgroundColor = "#70fff8";
        button.disabled = false;

    } catch (error) {
        console.error(`Error handling ${type}:`, error);
        showToast('default');
        button.textContent = type === 'solara' ? "安裝" : "尋找";
        button.style.backgroundColor = "#70fff8";
        button.disabled = false;
    }
}

function initializeExecutors() {
    const executors = ['wave', 'solara', 'zorara'];
    
    for (const type of executors) {
        const button = document.getElementById(`find-${type}`);
        if (button) {
            // Solara 特殊處理
            if (type === 'solara') {
                button.textContent = "安裝";
            } else {
                button.textContent = "尋找";
            }
            button.style.backgroundColor = "#70fff8";
        }
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