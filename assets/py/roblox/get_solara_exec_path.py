import os
import tkinter as tk
from tkinter import filedialog
import threading

def find_bootstrapper_in_drive(drive, found_event):
    """在單一硬碟中查找 Bootstrapper.exe，並在找到後觸發事件"""
    exclude_dirs = ["$Recycle.Bin", "System Volume Information", "Windows", "Program Files", "Program Files (x86)"]
    
    for root, dirs, files in os.walk(drive):
        if found_event.is_set():  # 如果已找到，立即返回
            return None

        if any(excluded in root for excluded in exclude_dirs):
            continue  # 跳過排除的目錄

        if "Bootstrapper.exe" in files:
            found_event.set()  # 標記找到
            return os.path.join(root, "Bootstrapper.exe")
    return None

def find_bootstrapper_in_all_drives():
    """使用多執行緒在所有硬碟中查找 Bootstrapper.exe"""
    drives = ['C:\\', 'D:\\', 'E:\\']  # 可擴展到其他磁碟
    found_event = threading.Event()  # 用於同步控制

    # 創建執行緒來並行搜索
    threads = []
    results = [None] * len(drives)
    for i, drive in enumerate(drives):
        thread = threading.Thread(target=lambda idx, d: results.__setitem__(idx, find_bootstrapper_in_drive(d, found_event)), args=(i, drive))
        threads.append(thread)
        thread.start()

    # 等待所有執行緒完成
    for thread in threads:
        thread.join()

    # 返回找到的第一個結果
    return next((result for result in results if result), None)

def prompt_for_bootstrapper_path():
    """提示使用者手動選擇 Bootstrapper.exe 檔案"""
    root = tk.Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(title="選擇 Bootstrapper.exe 檔案", filetypes=[("可執行檔", "*.exe")])
    return file_path

def get_bootstrapper_path():
    """自動搜索或提示使用者選擇 Bootstrapper.exe 的路徑"""
    print("自動搜索 Bootstrapper.exe 中...")
    bootstrapper_path = find_bootstrapper_in_all_drives()

    if not bootstrapper_path:
        print("未找到 Bootstrapper.exe，請手動選擇檔案位置。")
        bootstrapper_path = prompt_for_bootstrapper_path()

    return bootstrapper_path

# 執行 Bootstrapper.exe
bootstrapper_path = get_bootstrapper_path()

if bootstrapper_path:
    print(f"正在開啟：{bootstrapper_path}")
    os.startfile(bootstrapper_path)
else:
    print("無法找到或開啟 Bootstrapper.exe。")
