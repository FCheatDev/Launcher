// 獲取側邊欄、關閉按鈕和導航清單元素
const sidebar = document.querySelector(".sidebar");
const closeBtn = document.querySelector("#btn");
const navList = document.querySelector(".nav-list");

// 點擊關閉按鈕來切換側邊欄開關狀態
closeBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open"); // 切換側邊欄的開啟狀態
  navList.classList.toggle("scroll"); // 切換滾動狀態
  menuBtnChange(); // 調用更換按鈕圖標的函數
});

// 更改按鈕圖標以指示側邊欄狀態
function menuBtnChange() {
  if (sidebar.classList.contains("open")) {
    closeBtn.classList.replace("bx-menu", "bx-menu-alt-right"); // 改變圖標以指示可關閉
  } else {
    closeBtn.classList.replace("bx-menu-alt-right", "bx-menu"); // 改變圖標以指示可開啟
  }
}
document.addEventListener("DOMContentLoaded", function () {
  // 獲取所有的 span 元素
  const textElements = document.querySelectorAll(".fade-text");
  let delay = 300; // 初始延遲時間為 1 秒（1000 毫秒）

  textElements.forEach((span, index) => {
      setTimeout(() => {
          span.classList.add("fade-in");
      }, delay);
      delay += 100; // 每次延遲增加 0.1 秒（100 毫秒）
  });
});
