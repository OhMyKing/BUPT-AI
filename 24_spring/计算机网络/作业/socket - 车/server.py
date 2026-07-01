#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time : 2024/4/17 0:26
# @Author : Qiuwj
# @Description : The file is used to create server

import socket
import threading


ip_port = ('127.0.0.1', 82)


def tcp_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(ip_port)
    print('服务器创建成功，开始监听\n')
    server_socket.listen(5)
    conn, addr = server_socket.accept()
    while True:
        recv_data = conn.recv(1024)
        recv_data = recv_data.decode()
        if not recv_data:
            continue
        elif recv_data == 'exit':
            print('客户端退出\n')
            conn.close()
            break
        print('收到客户端的消息为：{}'.format(recv_data))
        response_data = '服务器端收到来自客户端的消息：{}'.format(recv_data).encode()
        conn.sendall(response_data)


def tcp_server_mt():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(ip_port)
    print('服务器创建成功，开始监听\n')
    server_socket.listen(5)
    while True:
        conn, addr = server_socket.accept()
        handle_thread = threading.Thread(target=handle_tcp_link, args=(conn, addr,))
        handle_thread.start()


def handle_tcp_link(conn, addr):
    while True:
        recv_data = conn.recv(1024)
        recv_data = recv_data.decode()
        if not recv_data:
            continue
        elif recv_data == 'exit':
            print("客户端{}:{}退出\n".format(addr[0], addr[1]))
            conn.close()
            break
        print('收到客户端{}:{}的消息为：{}'.format(addr[0], addr[1], recv_data))
        response_data = '服务器端收到来自客户端{}:{}的消息:{}'.format(addr[0], addr[1], recv_data).encode()
        conn.sendall(response_data)


def udp_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server_socket.bind(ip_port)
    while True:
        recv_data, addr = server_socket.recvfrom(1024)
        if not recv_data:
            continue
        recv_data = recv_data.decode()
        print('收到客户端{}:{}的消息为:{}\n'.format(addr[0], addr[1], recv_data))
        response_data = '收到客户端{}:{}的消息为:{}'.format(addr[0], addr[1], recv_data).encode()
        server_socket.sendto(response_data, addr)


if __name__ == '__main__':
    # tcp_server()
    # udp_server()
    tcp_server_mt()