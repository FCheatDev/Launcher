import os
import tkinter as tk
from tkinter import filedialog
import threading

def find_executable_in_drive(drive, executable_name, found_event):
    """在單一硬碟中查找指定的可執行檔，並在找到後觸發事件"""
    exclude_dirs = ["$Recycle.Bin", "System Volume Information", "Windows", "Program Files", "Program Files (x86)"]

    for root, dirs, files in os.walk(drive):
        if found_event.is_set():  # 如果已找到，立即返回
            return None

        if any(excluded in root for excluded in exclude_dirs):
            continue  # 跳過排除的目錄

        if executable_name in files:
            found_event.set()  # 標記找到
            return os.path.join(root, executable_name)
    return None

def find_executable_in_all_drives(executable_name):
    """使用多執行緒在所有硬碟中查找指定的可執行檔"""
    drives = ['C:\\', 'D:\\', 'E:\\']  # 可擴展到其他磁碟
    found_event = threading.Event()  # 用於同步控制

    # 創建執行緒來並行搜索
    threads = []
    results = [None] * len(drives)
    for i, drive in enumerate(drives):
        thread = threading.Thread(target=lambda idx, d: results.__setitem__(idx, find_executable_in_drive(d, executable_name, found_event)), args=(i, drive))
        threads.append(thread)
        thread.start()

    # 等待所有執行緒完成
    for thread in threads:
        thread.join()

    # 返回找到的第一個結果
    return next((result for result in results if result), None)

def prompt_for_executable_path(executable_name):
    """提示使用者手動選擇可執行檔"""
    root = tk.Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(title=f"選擇 {executable_name} 檔案", filetypes=[("可執行檔", "*.exe")])
    return file_path

def get_executable_path(executable_name):
    """自動搜索或提示使用者選擇可執行檔的路徑"""
    print(f"自動搜索 {executable_name} 中...")
    executable_path = find_executable_in_all_drives(executable_name)

    if not executable_path:
        print(f"未找到 {executable_name}，請手動選擇檔案位置。")
        executable_path = prompt_for_executable_path(executable_name)

    return executable_path

# 執行 ZoraraUI.exe
executable_name = "ZoraraUI.exe"
zorara_path = get_executable_path(executable_name)

if zorara_path:
    print(f"正在開啟：{zorara_path}")
    os.startfile(zorara_path)
else:
    print(f"無法找到或開啟 {executable_name}。")
