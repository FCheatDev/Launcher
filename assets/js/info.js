// 定義錯誤類型映射
const ERROR_TYPES = {
    INSTALLATION_FAILED: {
        message: '安裝失敗',
        description: '無法完成安裝，請檢查權限或磁碟空間'
    },
    LAUNCH_FAILED: {
        message: '啟動失敗',
        description: '程序無法啟動，請檢查安裝是否完整'
    },
    FILE_NOT_FOUND: {
        message: '檔案未找到',
        description: '所需檔案不存在或已損壞'
    }
};

let toastCount = 0;
let toastStack = [];
let maxToasts = 3;

function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.style.transform = "translateX(400px)";
        toastStack = toastStack.filter(item => item.id !== toastId);
        toastCount--;
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }
}

async function showToast(status, filePath = '', messageInfo = '') {
    if (status === 'pending') return;

    if (toastCount >= maxToasts) {
        closeToast(toastStack[0].id);
    }

    const toastId = 'toast' + Date.now();
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.id = toastId;
    
    if (filePath) {
        toast.classList.add('with-path');
    }

    toastStack.push({ id: toastId, element: toast });

    let toastContent;
    let borderColor;

    switch (status) {
        case 'success':
            if (filePath) {
                // 顯示安裝成功和檔案路徑
                const displayPath = filePath.replace(/\\/g, '/');
                toastContent = `
                    <div class="success-1">
                        <i class="fas fa-check-square"></i>
                    </div>
                    <div class="success-2">
                        <p>安裝成功</p>
                        <p style="word-break: break-all; font-size: 11px; line-height: 1.2; margin-top: 2px;">
                             ${displayPath}
                        </p>
                    </div>
                `;
            } else if (messageInfo) {
                // 顯示檔案檢驗信息
                toastContent = `
                    <div class="success-1">
                        <i class="fas fa-check-square"></i>
                    </div>
                    <div class="success-2">
                        <p>${messageInfo.title || '檔案檢驗'}</p>
                        <p style="word-break: break-all; font-size: 11px; line-height: 1.2; margin-top: 2px;">
                             ${messageInfo.message || '正在處理...'}
                        </p>
                    </div>
                `;
            }
            borderColor = '#5cb85c';
            break;
            
        case 'error':
            const error = typeof messageInfo === 'string' 
                ? ERROR_TYPES[messageInfo] 
                : {
                    message: messageInfo.title || '發生錯誤',
                    description: messageInfo.message || '請稍後重試或聯繫支援'
                };
            
            toastContent = `
                <div class="error-1">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="error-2">
                    <p>${error.message}</p>
                    <div class="error-details">
                        <p>${error.description}</p>
                    </div>
                </div>
            `;
            borderColor = '#ff0000';
            break;
            
        default:
            return;
    }

    toast.innerHTML = `
        ${toastContent}
        <button class="close" onclick="closeToast('${toastId}')">×</button>
    `;
    toast.style.borderLeftColor = borderColor;

    document.querySelector('.info-wrapper').appendChild(toast);

    setTimeout(() => {
        toast.style.transform = "translateX(0)";
    }, 100);

    toastCount++;

    setTimeout(() => {
        closeToast(toastId);
    }, 3000);
}

window.closeToast = closeToast;