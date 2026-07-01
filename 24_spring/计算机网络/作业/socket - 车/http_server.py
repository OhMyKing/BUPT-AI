#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time : 2024/4/17 1:09
# @Author : Qiuwj
# @Description : The file is used to create http server

import socket
import threading


html_file_dir = './server_file'

ip_port = ('127.0.0.1', 81)


def http_server():
    http_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    http_socket.bind(ip_port)
    http_socket.listen(5)
    while True:
        conn, addr = http_socket.accept()
        handle_thread = threading.Thread(target=handle_http_get, args=(conn, addr,))
        handle_thread.start()


def handle_http_get(conn, addr):
    print('收到{}:{}的请求\n'.format(addr[0], addr[1]))
    while True:
        recv_data = conn.recv(1024)
        headers = recv_data.split(b'\r\n')
        file = headers[0].split()[1].decode()
        if file == '/':
            file = './index.html'
        try:
            with open(html_file_dir+file, 'rb') as f:
                content = f.read()
            response_data = b'HTTP/1.1 200 OK\r\n\r\n' + content
        except FileNotFoundError:
            response_data = b'HTTP/1.1 404 Not Found\r\n\r\nFile not found'
        conn.sendall(response_data)
        conn.close()
        break


if __name__ == '__main__':
    http_server()