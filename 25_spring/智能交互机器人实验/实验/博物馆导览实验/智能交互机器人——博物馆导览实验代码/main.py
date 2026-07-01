#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
import os 
import rospy
import sys
import signal
from std_msgs.msg import Float64
import time


os.system("gnome-terminal -e 'bash -c \"cd /home/bupt/wangdianyun/exp1/scrips/bash; bash ./start_vrep.sh;exec bash\"' && gnome-terminal -e 'bash -c \"cd /home/bupt/wangdianyun/exp1/scrips/bash; bash ./node_start.sh ;exec bash\"' ")

def callback(data):
    global time_total, vrep_start_flag
    time_total = data.data
    vrep_start_flag = vrep_start_flag + 1
    
def listener():
    rospy.Subscriber("/sim/joint/time", Float64, callback)

def talker():
    global time_total
    pub = rospy.Publisher('/playerStart', Float64, queue_size=10)
    rate = rospy.Rate(10)  # 10hz
    
    while not rospy.is_shutdown():
        hello_str = 0.0
        pub.publish(hello_str)
        print('\r Ctrl+C to break; total time use .... %f' % time_total, end="")
        rate.sleep()

if __name__ == '__main__':
    try:
        global time_total, vrep_start_flag
        rospy.init_node('listener', anonymous=True)
        rospy.loginfo("tool start...")
        listener()
        time_total = 0
        vrep_start_flag = 0

        print("vrep 启动后，请在 vrep 中按 ok,等待中。。。")
        while vrep_start_flag < 20:
            time.sleep(1)

        print("将开始运行用户程序")
        time.sleep(10)

        os.system("gnome-terminal -e 'bash -c \" cd /home/bupt/wangdianyun/exp1/scrips/bash; bash ./start_guide.sh;exec bash\"' && gnome-terminal -e 'bash -c \" cd /home/bupt/wangdianyun/exp1/scrips/bash; bash ./start_introduce.sh; exec bash\"' ")

        talker()
        
        while True:
            Q_uit = input("以上显示的是仿真结束的总时间！    输入q+Enter为退出所有端口!")
            if Q_uit == 'q':
                os.system("gnome-terminal -e 'bash -c \"cd /home/bupt/wangdianyun/exp1/scrips/bash ; bash ./kill_all.sh; exec bash\"' ")
                break
            else:
                print("输入指令有误！请重新输入q+Enter！")

    except rospy.ROSInterruptException:
        pass