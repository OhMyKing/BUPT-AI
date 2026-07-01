#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <fcntl.h>
#include <termios.h>
#include <time.h>
#include <arpa/inet.h>
#include <netinet/in.h>
#include <pthread.h>
#include <errno.h>

/***********************************************/
/* MiniGUI图形库头文件 */
#include <minigui/common.h>
#include <minigui/minigui.h>
#include <minigui/gdi.h>
#include <minigui/window.h>
#include <minigui/control.h>
/***********************************************/

/***********************************************/
/* 控件ID定义 */
#define IDC_RECEIVE_STATIC 100 /* 接收标签 */
#define IDC_SEND_STATIC 101 /* 发送标签 */
#define IDC_RECEIVE_EDIT 102 /* 接收文本框 */
#define IDC_SEND_EDIT 103 /* 发送文本框 */
#define IDC_SEND_BTN 104 /* 发送按钮 */
#define IDC_QUIT_BTN 105 /* 退出按钮 */

/* 虚拟键盘控件ID */
#define IDC_KEY_A 200 /* A键 */
#define IDC_KEY_B 201 /* B键 */
#define IDC_KEY_C 202 /* C键 */
#define IDC_KEY_D 203 /* D键 */
#define IDC_KEY_RESET 204 /* 重置键 */
#define IDC_KEY_BACKSPACE 205 /* 退格键 */

/* 网络配置 */
#define SERVER_PORT 3333 /* 服务器端口 */
#define SERVER_IP "127.0.0.1" /* 服务器IP地址 */
#define MAX_MSG_SIZE 100 /* 消息最大长度 */

/* 全局变量 */
static BITMAP bmp_qq_logo; /* QQ图标位图 */

/* 函数声明 */
static void create_controls(HWND hWnd);
static int send_and_receive_message(const char* message, char* response);

/* 发送消息到服务器并接收响应 */
static int send_and_receive_message(const char* message, char* response)
{
int sockfd, sendbytes, recvbytes;
struct sockaddr_in serv_addr;
fd_set readfds;
struct timeval timeout;

/* 创建TCP套接字 */
if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
perror("socket");
return -1;
}

/* 设置服务器地址结构 */
memset(&serv_addr, 0, sizeof(serv_addr));
serv_addr.sin_family = AF_INET; /* IPv4协议 */
serv_addr.sin_port = htons(SERVER_PORT); /* 端口号转换为网络字节序 */
inet_pton(AF_INET, SERVER_IP, &serv_addr.sin_addr); /* IP地址转换 */

/* 连接服务器 */
if (connect(sockfd, (struct sockaddr *)&serv_addr, sizeof(struct sockaddr)) == -1) {
perror("connect");
close(sockfd);
return -1;
}

printf("Connected to server\n");

/* 发送消息 */
if ((sendbytes = send(sockfd, message, strlen(message), 0)) == -1) {
perror("send");
close(sockfd);
return -1;
}

printf("Sent: %s\n", message);

/* 设置接收超时 */
FD_ZERO(&readfds);
FD_SET(sockfd, &readfds);
timeout.tv_sec = 2; /* 2秒超时 */
timeout.tv_usec = 0;

/* 等待服务器响应 */
if (select(sockfd + 1, &readfds, NULL, NULL, &timeout) > 0) {
/* 清空响应缓冲区 */
memset(response, 0, MAX_MSG_SIZE);

/* 接收响应 */
recvbytes = recv(sockfd, response, MAX_MSG_SIZE - 1, 0);

if (recvbytes > 0) {
response[recvbytes] = '\0';
printf("Received: %s\n", response);
} else if (recvbytes == 0) {
strcpy(response, message); /* 无响应时显示发送的消息 */
} else {
perror("recv");
strcpy(response, "Receive error");
}
} else {
printf("No response from server (timeout)\n");
strcpy(response, message);
}

/* 关闭socket */
close(sockfd);

return 0;
}

/***********************************************/
/* 创建所有控件 */
static void create_controls(HWND hWnd)
{
/* 接收标签 */
CreateWindow(
CTRL_STATIC,
"Receive:",
WS_CHILD | SS_LEFT | WS_VISIBLE,
IDC_RECEIVE_STATIC,
20, 120, 60, 20,
hWnd,
0
);

/* 接收文本框 (只读) - 初始为空 */
CreateWindow(
CTRL_SLEDIT,
"", /* 初始为空 */
WS_CHILD | WS_VISIBLE | WS_BORDER | ES_READONLY,
IDC_RECEIVE_EDIT,
80, 120, 140, 24,
hWnd,
0
);

/* 发送标签 */
CreateWindow(
CTRL_STATIC,
"Send:",
WS_CHILD | SS_LEFT | WS_VISIBLE,
IDC_SEND_STATIC,
20, 150, 60, 20,
hWnd,
0
);

/* 发送文本框 - 初始为空 */
CreateWindow(
CTRL_SLEDIT,
"", /* 初始为空 */
WS_CHILD | WS_VISIBLE | WS_BORDER,
IDC_SEND_EDIT,
80, 150, 140, 24,
hWnd,
0
);

/* 发送按钮 */
CreateWindow(
CTRL_BUTTON,
"Send",
WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
IDC_SEND_BTN,
50, 185, 60, 25,
hWnd,
0
);

/* 退出按钮 */
CreateWindow(
CTRL_BUTTON,
"Quit",
WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
IDC_QUIT_BTN,
130, 185, 60, 25,
hWnd,
0
);

/* 虚拟键盘 - 第一行: A B C D */
CreateWindow(
CTRL_BUTTON,
"A",
WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
IDC_KEY_A,
20, 220, 40, 30,
hWnd,
0
);

CreateWindow(
CTRL_BUTTON,
"B",
WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
IDC_KEY_B,
70, 220, 40, 30,
hWnd,
0
);

CreateWindow(
CTRL_BUTTON,
"C",
WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
IDC_KEY_C,
120, 220, 40, 30,
hWnd,
0
);

CreateWindow(
CTRL_BUTTON,
"D",
WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
IDC_KEY_D,
170, 220, 40, 30,
hWnd,
0
);

/* 第二行: RESET 和 退格键 */
CreateWindow(
CTRL_BUTTON,
"RESET",
WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
IDC_KEY_RESET,
20, 255, 70, 30,
hWnd,
0
);

CreateWindow(
CTRL_BUTTON,
"<-",
WS_CHILD | BS_PUSHBUTTON | WS_VISIBLE | WS_TABSTOP,
IDC_KEY_BACKSPACE,
140, 255, 70, 30,
hWnd,
0
);
}

/* 主窗口消息处理函数 */
static int MiniQQWinProc(HWND hWnd, int message, WPARAM wParam, LPARAM lParam)
{
HDC hdc;
static char send_buffer[MAX_MSG_SIZE]; /* 发送缓冲区 */
static char recv_buffer[MAX_MSG_SIZE]; /* 接收缓冲区 */

switch (message) {
case MSG_CREATE:
/* 加载QQ图标 */
LoadBitmap(HDC_SCREEN, &bmp_qq_logo, "./huangdi.bmp");

/* 创建所有控件 */
create_controls(hWnd);
break;

case MSG_COMMAND:
switch (wParam) {
case IDC_QUIT_BTN:
/* 处理退出按钮 */
PostMessage(hWnd, MSG_CLOSE, 0, 0);
break;

case IDC_SEND_BTN:
/* 获取发送文本框内容并发送到服务器 */
memset(send_buffer, 0, sizeof(send_buffer));
GetWindowText(GetDlgItem(hWnd, IDC_SEND_EDIT), send_buffer, MAX_MSG_SIZE);

if (strlen(send_buffer) > 0) {
/* 发送消息并接收响应 */
memset(recv_buffer, 0, sizeof(recv_buffer));

if (send_and_receive_message(send_buffer, recv_buffer) == 0) {
/* 在接收文本框中显示响应 */
SetWindowText(GetDlgItem(hWnd, IDC_RECEIVE_EDIT), recv_buffer);
} else {
/* 显示错误信息 */
SetWindowText(GetDlgItem(hWnd, IDC_RECEIVE_EDIT), "连接失败!");
}
}
break;

case IDC_KEY_A:
case IDC_KEY_B:
case IDC_KEY_C:
case IDC_KEY_D:
{
/* 向发送文本框添加字母 */
char letter[2] = {0, 0};
switch (wParam) {
case IDC_KEY_A: letter[0] = 'A'; break;
case IDC_KEY_B: letter[0] = 'B'; break;
case IDC_KEY_C: letter[0] = 'C'; break;
case IDC_KEY_D: letter[0] = 'D'; break;
}

memset(send_buffer, 0, sizeof(send_buffer));
GetWindowText(GetDlgItem(hWnd, IDC_SEND_EDIT), send_buffer, MAX_MSG_SIZE);
if (strlen(send_buffer) < MAX_MSG_SIZE - 1) {
strcat(send_buffer, letter);
SetWindowText(GetDlgItem(hWnd, IDC_SEND_EDIT), send_buffer);
}
break;
}

case IDC_KEY_RESET:
/* 清空发送文本框 */
SetWindowText(GetDlgItem(hWnd, IDC_SEND_EDIT), "");
break;

case IDC_KEY_BACKSPACE:
/* 删除发送文本框最后一个字符 */
memset(send_buffer, 0, sizeof(send_buffer));
GetWindowText(GetDlgItem(hWnd, IDC_SEND_EDIT), send_buffer, MAX_MSG_SIZE);
if (strlen(send_buffer) > 0) {
send_buffer[strlen(send_buffer) - 1] = 0;
SetWindowText(GetDlgItem(hWnd, IDC_SEND_EDIT), send_buffer);
}
break;
}
break;

case MSG_PAINT:
hdc = BeginPaint(hWnd);

/* 绘制QQ图标 */
FillBoxWithBitmap(hdc, 70, 10, 100, 100, &bmp_qq_logo);

EndPaint(hWnd, hdc);
return 0;

case MSG_DESTROY:
/* 释放位图资源 */
UnloadBitmap(&bmp_qq_logo);

DestroyAllControls(hWnd);
return 0;

case MSG_CLOSE:
DestroyMainWindow(hWnd);
PostQuitMessage(hWnd);
return 0;
}

return DefaultMainWinProc(hWnd, message, wParam, lParam);
}

/* MiniGUI应用程序入口 */
int MiniGUIMain(int argc, const char* argv[])
{
MSG Msg;
HWND hMainWnd;
MAINWINCREATE CreateInfo;

#ifdef _LITE_VERSION
SetDesktopRect(0, 0, 240, 320); /* 设置分辨率 */
#endif

/* 设置主窗口参数 */
CreateInfo.dwStyle = WS_CAPTION | WS_BORDER | WS_VISIBLE;
CreateInfo.dwExStyle = WS_EX_NONE;
CreateInfo.spCaption = "Login Successfully 2022211733";
CreateInfo.hMenu = 0;
CreateInfo.hCursor = GetSystemCursor(IDC_ARROW);
CreateInfo.hIcon = 0;
CreateInfo.MainWindowProc = MiniQQWinProc;
CreateInfo.lx = 0;
CreateInfo.ty = 0;
CreateInfo.rx = 240;
CreateInfo.by = 320;
CreateInfo.iBkColor = COLOR_lightwhite;
CreateInfo.dwAddData = 0;
CreateInfo.dwReserved = 0;
CreateInfo.hHosting = HWND_DESKTOP;

/* 创建主窗口 */
hMainWnd = CreateMainWindow(&CreateInfo);
if (hMainWnd == HWND_INVALID)
return -1;

/* 显示主窗口 */
ShowWindow(hMainWnd, SW_SHOWNORMAL);

/* 消息循环 */
while (GetMessage(&Msg, hMainWnd)) {
TranslateMessage(&Msg);
DispatchMessage(&Msg);
}

/* 清理资源 */
MainWindowThreadCleanup(hMainWnd);

return 0;
}

#ifndef _LITE_VERSION
#include <minigui/dti.c>
#endif
