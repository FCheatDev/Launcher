let toastCount = 0;  // 当前显示的提示框数量
let toastStack = []; // 用于记录所有当前显示的提示框
let maxToasts = 3;   // 最大堆叠数

function showToast() {
    // 创建新的提示框
    if (toastCount >= maxToasts) {
        // 如果超过最大堆叠数，关闭最早的提示框
        closeToast(toastStack[0].id);
    }

    const toastId = 'toast' + Date.now(); // 为每个提示框生成唯一 ID
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.id = toastId;
    
    // 增加提示框到堆栈
    toastStack.push({ id: toastId, element: toast });

    // 设置提示框样式和内容
    toast.innerHTML = `
        <div class="success-1">
            <i class="fas fa-check-square"></i>
        </div>
        <div class="success-2">
            <p>查找成功</p>
            <p>檔案位置在:</p>
        </div>
        <button class="close" onclick="closeToast('${toastId}')">×</button>
    `;

    // 将新的提示框添加到页面中
    document.querySelector('.info-wrapper').appendChild(toast);

    // 显示提示框
    setTimeout(() => {
        toast.style.transform = "translateX(0)";
    }, 100);

    // 增加提示框计数
    toastCount++;

    // 自动关闭提示框
    setTimeout(() => {
        closeToast(toastId);
    }, 4000);  // 4秒后自动关闭
}

function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.style.transform = "translateX(400px)";
        // 从堆栈中移除该提示框
        toastStack = toastStack.filter(item => item.id !== toastId);
        // 减少提示框计数
        toastCount--;
        // 从页面中移除提示框
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }
}
