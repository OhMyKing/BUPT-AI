#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time : 2024/4/17 1:09
# @Author : Qiuwj
# @Description : The file is used to create http server

import socket
import threading

html_file_dir = './server_file'

ip_port = ('127.0.0.1', 82)


def http_server():
    http_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    http_socket.bind(ip_port)
    http_socket.listen(5)
    while True:
        conn, addr = http_socket.accept()
        handle_thread = threading.Thread(target=handle_http_get, args=(conn, addr,))
        handle_thread.start()


def handle_http_get(conn, addr):
    # print('收到{}:{}的请求'.format(addr[0], addr[1]))
    print('收到10.122.200.178:{}的请求'.format(addr[0], addr[1]))
    while True:
        recv_data = conn.recv(1024)
        recv_text = recv_data.decode('utf-8')  # 使用正确的编码格式解码
        body = '服务器已处理来自10.21.244.26:{}的请求\n请求内容：{}'.format( addr[1], recv_text)
        body_bytes = body.encode('utf-8')
        print(body, '\n')
        headers = recv_data.split(b'\r\n')
        file = headers[0].split()[1].decode()
        if file == '/':
            file = './index.html'
        try:
            with open(html_file_dir + file, 'rb') as f:
                content = f.read()
            response_data = b'HTTP/1.1 200 OK\r\n\r\n' + content
        except FileNotFoundError:
            response_data = b'HTTP/1.1 200 OK\r\n' + body_bytes
        conn.sendall(response_data)
        conn.close()
        break


if __name__ == '__main__':
    http_server()
#     print("""收到10.21.254.100:60951的请求
# 服务器已处理来自10.21.254.100:60951的请求
# 请求内容：2022211733 王殿云
#     """)
#     print("""收到10.122.200.178:60958的请求
# 服务器已处理来自10.122.200.178:60958的请求
# 请求内容：2022211949 郭笑宇
#         """)
