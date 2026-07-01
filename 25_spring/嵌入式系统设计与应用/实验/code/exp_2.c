#include <stdio.h>
#include <stdlib.h>
#include <string.h>    
#include <unistd.h>      
#include <sys/types.h>   
#include <fcntl.h>       
#include <termios.h>    
#include <time.h>
#include <arpa/inet.h>
#include <netinet/in.h>

// MiniGUI相关头文件
#include <minigui/common.h>
#include <minigui/minigui.h>
#include <minigui/gdi.h>
#include <minigui/window.h>
#include <minigui/control.h>

// 控件ID定义
#define IDC_USERNAME_STATIC      100    // 用户名标签
#define IDC_PASSWORD_STATIC      101    // 密码标签
#define IDC_USERNAME_EDIT        102    // 用户名输入框
#define IDC_PASSWORD_EDIT        103    // 密码输入框
#define IDC_LOGIN_BTN            104    // 登录按钮
#define IDC_SOFT_KEYBOARD_BTN    105    // 软键盘按钮
#define IDC_QUIT_BTN             106    // 退出按钮

// 子窗口控件ID
#define IDC_SUBDLG_QUIT          107    // 子对话框退出按钮
#define IDC_SUBDLG_SEND          108    // 发送按钮
#define IDC_SUBDLG_RECEIVE_EDIT  109    // 接收消息框
#define IDC_SUBDLG_SEND_EDIT     110    // 发送消息框

// 软键盘控件ID基础值
#define IDC_KEYBOARD_BASE        200

// 网络设置
#define SERVER_PORT              3333           // 服务器端口
#define SERVER_IP                "127.0.0.1"   // 服务器IP
#define MAX_MSG_SIZE             100            // 最大消息长度

// 全局变量
static HWND username_edit, password_edit;          // 用户名和密码输入框句柄
static HWND login_btn, soft_keyboard_btn, quit_btn; // 按钮句柄
static BITMAP bmp_qq_logo;                         // QQ图标位图
static char username_buf[30] = "";                 // 用户名缓冲区
static char password_buf[30] = "";                 // 密码缓冲区
static int login_success = 0;                      // 登录状态标志
static HWND current_edit = NULL;                   // 当前活动输入框

// 数字键盘定义
#define KEYBOARD_NUM_KEYS        12
static const char* keyboard_captions[] = {
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "RESET", "<-"
};

static const char* keyboard_hints[] = {
    "Number 0", "Number 1", "Number 2", "Number 3", "Number 4",
    "Number 5", "Number 6", "Number 7", "Number 8", "Number 9", 
    "Reset input", "Backspace"
};

// 字母键盘定义（用于消息输入）
#define LETTER_KEYBOARD_KEYS     8
static const char* letter_keyboard_captions[] = {
    "A", "B", "C", "D", "RESET", "<-", "SEND", "QUIT"
};

// 函数声明
static void create_controls(HWND hWnd);              // 创建主窗口控件
static void create_num_keyboard(HWND hWnd);          // 创建数字键盘
static void create_letter_keyboard(HWND hWnd);       // 创建字母键盘
static void show_login_failed_dialog(HWND hWnd);     // 显示登录失败对话框
static void show_login_success_dialog(HWND hWnd);    // 显示登录成功对话框
static int send_message_to_server(const char* message); // 发送消息到服务器

// 登录成功对话框模板
static DLGTEMPLATE LoginSuccessDlg = {
    WS_BORDER | WS_CAPTION,
    WS_EX_NONE,
    0, 0, 240, 320,
    "Login Successfully",
    0, 0,
    5, NULL,
    0
};

// 登录成功对话框控件定义
static CTRLDATA LoginSuccessDlgCtrl[] = {
    // 接收消息显示框
    {
        CTRL_SLEDIT,
        WS_VISIBLE | WS_BORDER | ES_READONLY | ES_AUTOWRAP,
        20, 120, 200, 30,
        IDC_SUBDLG_RECEIVE_EDIT,
        "", 
        0
    },
    // 发送消息输入框
    {
        CTRL_SLEDIT,
        WS_VISIBLE | WS_BORDER | ES_AUTOWRAP,
        20, 150, 200, 30,
        IDC_SUBDLG_SEND_EDIT,
        "",
        0
    },
    // 发送按钮
    {
        CTRL_BUTTON,
        WS_TABSTOP | WS_VISIBLE | BS_DEFPUSHBUTTON,
        50, 180, 60, 30,
        IDC_SUBDLG_SEND,
        "Send",
        0
    },
    // 退出按钮
    {
        CTRL_BUTTON,
        WS_TABSTOP | WS_VISIBLE | BS_PUSHBUTTON,
        130, 180, 60, 30,
        IDC_SUBDLG_QUIT,
        "Quit",
        0
    },
    // 字母键盘占位符（动态创建）
    {
        CTRL_STATIC,
        WS_VISIBLE,
        20, 200, 200, 100,
        0,
        "",
        0
    }
};

// 登录失败对话框模板
static DLGTEMPLATE LoginFailedDlg = {
    WS_BORDER | WS_CAPTION,
    WS_EX_NONE,
    0, 0, 240, 320,
    "Login Failed",
    0, 0,
    1, NULL,
    0
};

// 登录失败对话框控件定义
static CTRLDATA LoginFailedDlgCtrl[] = {
    // 退出按钮
    {
        CTRL_BUTTON,
        WS_TABSTOP | WS_VISIBLE | BS_DEFPUSHBUTTON,
        100, 250, 50, 30,
        IDC_SUBDLG_QUIT,
        "Quit",
        0
    }
};

// 登录成功对话框消息处理函数
static int LoginSuccessDialogProc(HWND hDlg, int message, WPARAM wParam, LPARAM lParam)
{
    static char send_buffer[MAX_MSG_SIZE];
    
    switch (message) {
        case MSG_INITDIALOG:
            // 创建字母键盘
            create_letter_keyboard(hDlg);
            return 1;
            
        case MSG_COMMAND:
            switch (wParam) {
                case IDC_SUBDLG_QUIT:
                    EndDialog(hDlg, wParam);
                    break;
                    
                case IDC_SUBDLG_SEND:
                    // 获取发送框中的文本
                    memset(send_buffer, 0, sizeof(send_buffer));
                    GetWindowText(GetDlgItem(hDlg, IDC_SUBDLG_SEND_EDIT), send_buffer, MAX_MSG_SIZE);
                    
                    // 发送消息到服务器
                    if (strlen(send_buffer) > 0) {
                        if (send_message_to_server(send_buffer) == 0) {
                            // 在接收框中显示已发送的消息
                            SetWindowText(GetDlgItem(hDlg, IDC_SUBDLG_RECEIVE_EDIT), send_buffer);
                        }
                    }
                    break;
                    
                // 处理字母键盘按键
                case IDC_KEYBOARD_BASE ... IDC_KEYBOARD_BASE + LETTER_KEYBOARD_KEYS - 1:
                {
                    int key_index = wParam - IDC_KEYBOARD_BASE;
                    if (key_index >= 0 && key_index < 4) {
                        // 添加A、B、C、D到输入框
                        char key_str[2] = {letter_keyboard_captions[key_index][0], 0};
                        memset(send_buffer, 0, sizeof(send_buffer));
                        GetWindowText(GetDlgItem(hDlg, IDC_SUBDLG_SEND_EDIT), send_buffer, MAX_MSG_SIZE);
                        strcat(send_buffer, key_str);
                        SetWindowText(GetDlgItem(hDlg, IDC_SUBDLG_SEND_EDIT), send_buffer);
                    } else if (key_index == 4) {
                        // RESET按钮 - 清空输入
                        SetWindowText(GetDlgItem(hDlg, IDC_SUBDLG_SEND_EDIT), "");
                    } else if (key_index == 5) {
                        // 退格按钮
                        memset(send_buffer, 0, sizeof(send_buffer));
                        GetWindowText(GetDlgItem(hDlg, IDC_SUBDLG_SEND_EDIT), send_buffer, MAX_MSG_SIZE);
                        if (strlen(send_buffer) > 0) {
                            send_buffer[strlen(send_buffer) - 1] = 0;
                            SetWindowText(GetDlgItem(hDlg, IDC_SUBDLG_SEND_EDIT), send_buffer);
                        }
                    }
                    break;
                }
            }
            break;
            
        case MSG_CLOSE:
            EndDialog(hDlg, wParam);
            break;
            
        case MSG_ERASEBKGND:
        {
            // 处理背景擦除消息 - 绘制白色背景和QQ图标
            HDC hdc = (HDC)wParam;
            const RECT* clip = (const RECT*)lParam;
            BOOL fGetDC = FALSE;
            RECT rcTemp;

            if (hdc == 0) {
                hdc = GetClientDC(hDlg);
                fGetDC = TRUE;
            }

            if (clip) {
                rcTemp = *clip;
                ScreenToClient(hDlg, &rcTemp.left, &rcTemp.top);
                ScreenToClient(hDlg, &rcTemp.right, &rcTemp.bottom);
                IncludeClipRect(hdc, &rcTemp);
            }

            // 填充白色背景
            SetBrushColor(hdc, PIXEL_lightwhite);
            FillBox(hdc, 0, 0, 240, 300);

            // 绘制QQ图标
            FillBoxWithBitmap(hdc, 70, 10, 100, 100, &bmp_qq_logo);

            if (fGetDC)
                ReleaseDC(hdc);
            return 0;
        }
    }
    
    return DefaultDialogProc(hDlg, message, wParam, lParam);
}

// 登录失败对话框消息处理函数
static int LoginFailedDialogProc(HWND hDlg, int message, WPARAM wParam, LPARAM lParam)
{
    switch (message) {
        case MSG_INITDIALOG:
            return 1;
            
        case MSG_COMMAND:
            switch (wParam) {
                case IDC_SUBDLG_QUIT:
                    EndDialog(hDlg, wParam);
                    break;
            }
            break;
            
        case MSG_CLOSE:
            EndDialog(hDlg, wParam);
            break;
            
        case MSG_ERASEBKGND:
        {
            // 绘制登录失败对话框背景
            HDC hdc = (HDC)wParam;
            const RECT* clip = (const RECT*)lParam;
            BOOL fGetDC = FALSE;
            RECT rcTemp;

            if (hdc == 0) {
                hdc = GetClientDC(hDlg);
                fGetDC = TRUE;
            }

            if (clip) {
                rcTemp = *clip;
                ScreenToClient(hDlg, &rcTemp.left, &rcTemp.top);
                ScreenToClient(hDlg, &rcTemp.right, &rcTemp.bottom);
                IncludeClipRect(hdc, &rcTemp);
            }

            // 填充白色背景
            SetBrushColor(hdc, PIXEL_lightwhite);
            FillBox(hdc, 0, 0, 240, 300);

            // 绘制QQ图标
            FillBoxWithBitmap(hdc, 70, 0, 100, 100, &bmp_qq_logo);

            if (fGetDC)
                ReleaseDC(hdc);
            return 0;
        }
    }
    
    return DefaultDialogProc(hDlg, message, wParam, lParam);
}

// 显示登录成功对话框
static void show_login_success_dialog(HWND hWnd)
{
    LoginSuccessDlg.controls = LoginSuccessDlgCtrl;
    DialogBoxIndirectParam(&LoginSuccessDlg, hWnd, LoginSuccessDialogProc, 0L);
}

// 显示登录失败对话框
static void show_login_failed_dialog(HWND hWnd)
{
    LoginFailedDlg.controls = LoginFailedDlgCtrl;
    DialogBoxIndirectParam(&LoginFailedDlg, hWnd, LoginFailedDialogProc, 0L);
}

// 发送消息到服务器（TCP客户端）
static int send_message_to_server(const char* message)
{
    int sockfd, sendbytes;
    struct sockaddr_in serv_addr;
    
    // 创建socket
    if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
        return -1;
    }
    
    // 设置服务器地址
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(SERVER_PORT);
    inet_pton(AF_INET, SERVER_IP, &serv_addr.sin_addr);
    
    // 连接到服务器
    if (connect(sockfd, (struct sockaddr *)&serv_addr, sizeof(struct sockaddr)) == -1) {
        close(sockfd);
        return -1;
    }
    
    // 发送消息
    if ((sendbytes = send(sockfd, message, strlen(message), 0)) == -1) {
        close(sockfd);
        return -1;
    }
    
    close(sockfd);
    return 0;
}

// 创建数字键盘
static void create_num_keyboard(HWND hWnd)
{
    HWND kb;
    int i;
    int x_start = 30;       // 键盘起始X坐标
    int y_start = 210;      // 键盘起始Y坐标
    int key_width = 45;     // 按键宽度
    int key_height = 27;    // 按键高度
    int x_gap = 0;         // 水平间距
    int y_gap = 0;         // 垂直间距
    
    // 创建键盘容器
    kb = CreateWindow(
        CTRL_STATIC,
        "",
        WS_CHILD | WS_VISIBLE | SS_GROUPBOX,
        0,
        x_start, y_start, 180, 81, 
        hWnd,
        0
    );
    
    // 创建4x3布局的数字键
    for (i = 0; i < KEYBOARD_NUM_KEYS; i++) {
        int row = i / 4;    // 计算行号
        int col = i % 4;    // 计算列号
        int x_pos = x_start + col * (key_width + x_gap);
        int y_pos = y_start + row * (key_height + y_gap);
        
        CreateWindow(
            CTRL_BUTTON,
            keyboard_captions[i],
            WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
            IDC_KEYBOARD_BASE + i,
            x_pos, y_pos, key_width, key_height,
            hWnd,
            0
        );
    }
}

// 创建字母键盘
static void create_letter_keyboard(HWND hWnd)
{
    int i;
    int x_start = 20;      // 键盘起始X坐标
    int y_start = 220;     // 键盘起始Y坐标
    int key_width = 40;    // 按键宽度
    int key_height = 30;   // 按键高度
    int x_gap = 0;         // 水平间距
    int y_gap = 0;         // 垂直间距
    
    // 创建字母键
    for (i = 0; i < LETTER_KEYBOARD_KEYS; i++) {
        int row = i / 4;   // 计算行号
        int col = i % 4;   // 计算列号
        int x_pos = x_start + col * (key_width + x_gap);
        int y_pos = y_start + row * (key_height + y_gap);
        
        CreateWindow(
            CTRL_BUTTON,
            letter_keyboard_captions[i],
            WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
            IDC_KEYBOARD_BASE + i,
            x_pos, y_pos, key_width, key_height,
            hWnd,
            0
        );
    }
}

// 创建主窗口所有控件
static void create_controls(HWND hWnd)
{
    // 创建静态标签 - 为QQ图标预留空间，向下调整位置
    CreateWindow(
        CTRL_STATIC,
        "User Name:",
        WS_CHILD | SS_SIMPLE | WS_VISIBLE,
        IDC_USERNAME_STATIC,
        20, 120, 80, 24,
        hWnd,
        0
    );
    
    CreateWindow(
        CTRL_STATIC,
        "Password:",
        WS_CHILD | SS_SIMPLE | WS_VISIBLE,
        IDC_PASSWORD_STATIC,
        20, 150, 80, 24,
        hWnd,
        0
    );
    
    // 创建输入框
    username_edit = CreateWindow(
        CTRL_SLEDIT,
        "",
        WS_CHILD | WS_VISIBLE | WS_BORDER,
        IDC_USERNAME_EDIT,
        110, 120, 120, 24,
        hWnd,
        0
    );
    
    password_edit = CreateWindow(
        CTRL_SLEDIT,
        "",
        WS_CHILD | WS_VISIBLE | WS_BORDER | ES_PASSWORD,  // 密码输入框
        IDC_PASSWORD_EDIT,
        110, 150, 120, 24,
        hWnd,
        0
    );
    
    // 创建按钮
    login_btn = CreateWindow(
        CTRL_BUTTON,
        "Login",
        WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
        IDC_LOGIN_BTN,
        30, 180, 80, 30,
        hWnd,
        0
    );
    
    soft_keyboard_btn = CreateWindow(
        CTRL_BUTTON,
        "Keyboard",
        WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
        IDC_SOFT_KEYBOARD_BTN,
        130, 180, 80, 30,
        hWnd,
        0
    );
}

// 主窗口消息处理函数
static int MiniQQWinProc(HWND hWnd, int message, WPARAM wParam, LPARAM lParam)
{
    static int show_keyboard = 0;  // 键盘显示状态
    
    switch (message) {
        case MSG_CREATE:
            // 加载QQ图标
            LoadBitmap(HDC_SCREEN, &bmp_qq_logo, "./src/huangdi.bmp");
            
            // 创建控件
            create_controls(hWnd);
            
            // 设置默认活动输入框为用户名输入框
            current_edit = username_edit;
            break;
            
        case MSG_COMMAND:
        {
            int id = LOWORD(wParam);
            
            switch (id) {
                case IDC_USERNAME_EDIT:
                    // 设置用户名输入框为当前活动输入框
                    current_edit = username_edit;
                    break;
                    
                case IDC_PASSWORD_EDIT:
                    // 设置密码输入框为当前活动输入框
                    current_edit = password_edit;
                    break;
                    
                case IDC_LOGIN_BTN:
                    // 获取用户名和密码
                    GetWindowText(username_edit, username_buf, sizeof(username_buf));
                    GetWindowText(password_edit, password_buf, sizeof(password_buf));
                    
                    // 简单验证：用户名和密码都不能为空
                    if (strlen(username_buf) > 0 && strlen(password_buf) > 0) {
                        login_success = 1;
                        show_login_success_dialog(hWnd);
                    } else {
                        login_success = 0;
                        show_login_failed_dialog(hWnd);
                    }
                    break;
                    
                case IDC_SOFT_KEYBOARD_BTN:
                    // 切换键盘显示状态
                    show_keyboard = !show_keyboard;
                    if (show_keyboard) {
                        create_num_keyboard(hWnd);
                    } else {
                        // 通过刷新区域隐藏键盘
                        InvalidateRect(hWnd, NULL, TRUE);
                    }
                    break;
                    
                case IDC_KEYBOARD_BASE ... IDC_KEYBOARD_BASE + KEYBOARD_NUM_KEYS - 1:
                {
                    // 处理键盘按键
                    int key_index = id - IDC_KEYBOARD_BASE;
                    
                    // 如果没有选中输入框，默认选择用户名输入框
                    if (current_edit == NULL) {
                        current_edit = username_edit;
                    }
                    
                    // 确保当前输入框有效
                    if (current_edit == username_edit || current_edit == password_edit) {
                        if (key_index >= 0 && key_index <= 9) {
                            // 数字键0-9
                            char key_str[2] = {keyboard_captions[key_index][0], 0};
                            char text[30] = "";
                            GetWindowText(current_edit, text, sizeof(text));
                            if (strlen(text) < 29) { // 防止缓冲区溢出
                                strcat(text, key_str);
                                SetWindowText(current_edit, text);
                            }
                        } else if (key_index == 10) {
                            // RESET键 - 清空输入框
                            SetWindowText(current_edit, "");
                        } else if (key_index == 11) {
                            // 退格键"<-" - 删除最后一个字符
                            char text[30] = "";
                            GetWindowText(current_edit, text, sizeof(text));
                            if (strlen(text) > 0) {
                                text[strlen(text) - 1] = 0;
                                SetWindowText(current_edit, text);
                            }
                        }
                    }
                    break;
                }
            }
            break;
        }
            
        case MSG_PAINT:
        {
            // 绘制窗口内容
            HDC hdc;
            hdc = BeginPaint(hWnd);
            // 绘制QQ图标（100x100像素）
            FillBoxWithBitmap(hdc, 70, 10, 100, 100, &bmp_qq_logo);
            
            EndPaint(hWnd, hdc);
            return 0;
        }
            
        case MSG_ERASEBKGND:
        {
            // 处理背景擦除消息
            HDC hdc = (HDC)wParam;
            const RECT* clip = (const RECT*)lParam;
            BOOL fGetDC = FALSE;
            RECT rcTemp;

            if (hdc == 0) {
                hdc = GetClientDC(hWnd);
                fGetDC = TRUE;
            }

            if (clip) {
                rcTemp = *clip;
                ScreenToClient(hWnd, &rcTemp.left, &rcTemp.top);
                ScreenToClient(hWnd, &rcTemp.right, &rcTemp.bottom);
                IncludeClipRect(hdc, &rcTemp);
            }

            // 填充浅白色背景
            SetBrushColor(hdc, PIXEL_lightwhite);
            FillBox(hdc, 0, 0, 240, 320);

            if (fGetDC)
                ReleaseDC(hdc);
            return 0;
        }
            
        case MSG_DESTROY:
            // 清理资源
            UnloadBitmap(&bmp_qq_logo);
            DestroyAllControls(hWnd);
            break;
            
        case MSG_CLOSE:
            // 关闭窗口
            DestroyMainWindow(hWnd);
            PostQuitMessage(hWnd);
            break;
            
        default:
            return DefaultMainWinProc(hWnd, message, wParam, lParam);
    }
    
    return 0;
}

// MiniGUI应用程序入口点
int MiniGUIMain(int argc, const char* argv[])
{
    MSG Msg;
    HWND hMainWnd;
    MAINWINCREATE CreateInfo;

#ifdef _LITE_VERSION
    // Lite版本设置桌面分辨率
    SetDesktopRect(0, 0, 240, 320);
#endif

    // 设置主窗口参数
    CreateInfo.dwStyle = WS_CAPTION | WS_BORDER | WS_VISIBLE;
    CreateInfo.dwExStyle = WS_EX_NONE;
    CreateInfo.spCaption = "MiniQQ v0.1 2022211733";  // 窗口标题
    CreateInfo.hMenu = 0;
    CreateInfo.hCursor = GetSystemCursor(IDC_ARROW);
    CreateInfo.hIcon = 0;
    CreateInfo.MainWindowProc = MiniQQWinProc;        // 窗口处理函数
    CreateInfo.lx = 0;
    CreateInfo.ty = 0;
    CreateInfo.rx = 240;    // 窗口宽度
    CreateInfo.by = 320;    // 窗口高度
    CreateInfo.iBkColor = COLOR_lightwhite;           // 背景色
    CreateInfo.dwAddData = 0;
    CreateInfo.dwReserved = 0;
    CreateInfo.hHosting = HWND_DESKTOP;

    // 创建主窗口
    hMainWnd = CreateMainWindow(&CreateInfo);
    if (hMainWnd == HWND_INVALID)
        return -1;

    // 显示主窗口
    ShowWindow(hMainWnd, SW_SHOWNORMAL);

    // 消息循环
    while (GetMessage(&Msg, hMainWnd)) {
        TranslateMessage(&Msg);
        DispatchMessage(&Msg);
    }

    // 清理工作
    MainWindowThreadCleanup(hMainWnd);

    return 0;
}

#ifndef _LITE_VERSION
#include <minigui/dti.c>
#endif