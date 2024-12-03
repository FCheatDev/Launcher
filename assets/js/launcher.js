// scripts.js
document.addEventListener("DOMContentLoaded", () => {
     const progressContainer = document.getElementById("progress-container");
     const progressBar = document.getElementById("progress-bar");
     const progressNumber = document.getElementById("progress-number");
     const progressText = document.getElementById("progress-text");
 
     // 模擬進度條進度
     function simulateProgress() {
         let progress = 0;
         const interval = setInterval(() => {
             if (progress >= 100) {
                 clearInterval(interval);
                 progressText.textContent = "加載完畢! ";
                 setTimeout(() => {
                     fadeOutLauncher(); // 淡出啟動畫面
                 }, 1000);
             } else {
                 progress += 2;
                 progressBar.style.width = `${progress}%`; // 更新填充條的寬度
                 progressNumber.textContent = `${progress}%`; // 更新數字
             }
         }, 50);
     }
 
     // 淡出啟動畫面並加載指定的 HTML
     function fadeOutLauncher() {
         document.querySelector(".launcher").style.transition = "opacity 1s ease-out";
         document.querySelector(".launcher").style.opacity = "0";
 
         setTimeout(() => {
             window.location.href = "assets/Games/games.html"; 
         }, 1000);
     }
 
     // 顯示進度條
     setTimeout(() => {
         progressContainer.classList.remove("hidden");
         simulateProgress();
     }, 2000); // 與 CSS 中的淡入動畫時長保持一致
 });
