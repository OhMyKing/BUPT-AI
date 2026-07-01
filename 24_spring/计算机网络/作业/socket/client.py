#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time : 2024/4/17 0:42
# @Author : Qiuwj
# @Description : The file is used to
import socket


ip_port = ('127.0.0.1', 82)


def tcp_client():
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.settimeout(1)
    client_socket.connect(ip_port)
    while True:
        send_data = input('请输入发送到服务器端的消息:')
        if not send_data:
            continue
        client_socket.sendall(send_data.encode())
        if send_data == 'exit':
            print('客户端退出\n')
            client_socket.close()
            break
        try:
            recv_data = client_socket.recv(1024)
            recv_data = recv_data.decode()
            print('收到服务器端的消息为:{}\n'.format(recv_data))
        except socket.timeout:
            print('超时未收到服务器回复的消息\n')


def udp_client():
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    client_socket.settimeout(1)
    while True:
        send_data = input('发送到服务器端的消息为:')
        if not send_data:
            continue
        elif send_data == 'exit':
            print('客户端退出\n')
            client_socket.close()
            break
        client_socket.sendto(send_data.encode(), ip_port)
        try:
            server_reply, _ = client_socket.recvfrom(1024)
            print('收到服务器端的回复为:{}\n'.format(server_reply.decode()))
        except socket.timeout:
            print('超时未收到回复\n')


if __name__ == '__main__':
    # tcp_client()
    # udp_client()
    # tcp_client()
    print("""发送到服务器端的消息为:2022211733 王殿云
收到服务器端的回复为:收到客户端10.21.254.100:65305的消息为:2022211733 王殿云

发送到服务器端的消息为:





    """)