let toastCount = 0;  // 当前显示的提示框数量
let toastStack = []; // 用于记录所有当前显示的提示框
let maxToasts = 3;   // 最大堆叠数

// 这个函数将根据状态显示不同内容
function showToast(status) {
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

    // 根据状态设置提示框内容
    let toastContent;
    let borderColor;
    let icon;
    let message;

    switch (status) {
        case 'search':
            toastContent = `
                <div class="search-1">
                    <i class="fas fa-search"></i>
                </div>
                <div class="search-2">
                    <p>查找資訊</p>
                    <p>查找中……</p>
                </div>
            `;
            borderColor = '#5a5959'; 
            icon = 'fas fa-search';
            message = '查找中......';
            break;
        case 'error':
            toastContent = `
                <div class="error-1">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="error-2">
                    <p>查找錯誤</p>
                    <p>請等待搜尋系統完成搜尋後再點擊:</p>
                </div>
            `;
            borderColor = '#ff0000'; // 红色边框
            icon = 'fas fa-exclamation-triangle';
            message = '请等待查找系统查找完毕再点击';
            break;
        case 'success':
            toastContent = `
                <div class="success-1">
                    <i class="fas fa-check-square"></i>
                </div>
                <div class="success-2">
                    <p>查找成功</p>
                    <p>檔案位置在:</p>
                </div>
            `;
            borderColor = '#5cb85c'; // 绿色边框
            icon = 'fas fa-check-square';
            message = '查找成功';
            break;
        default:
            toastContent = `
                <div class="default-1">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="default-2">
                    <p>查找系統</p>
                    <p>系統可能發生錯誤,請去Discord回饋</p>
                </div>
            `;
            borderColor = '#ffe600'; // 默认黄色边框
            icon = 'fas fa-info-circle';
            message = '未知狀態';
            break;
    }

    // 设置提示框内容和样式
    toast.innerHTML = `
        ${toastContent}
        <button class="close" onclick="closeToast('${toastId}')">×</button>
    `;
    toast.style.borderLeftColor = borderColor;

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
