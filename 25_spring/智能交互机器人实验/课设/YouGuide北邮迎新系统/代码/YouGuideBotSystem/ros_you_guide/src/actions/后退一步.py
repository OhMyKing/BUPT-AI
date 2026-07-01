#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import math
import time
import tty
import termios

import rospy
import rospkg

from std_msgs.msg import *
from lejulib import terminate

sys.path.append(rospkg.RosPack().get_path('leju_lib_pkg'))
import motion.bodyhub_client as bodycli


class Action(object):
    '''
    robot action
    '''

    def __init__(self, name, ctl_id):
        rospy.init_node(name, anonymous=True)
        time.sleep(0.2)
        rospy.on_shutdown(self.__ros_shutdown_hook)

        self.bodyhub = bodycli.BodyhubClient(ctl_id)

    def __ros_shutdown_hook(self):
        if self.bodyhub.reset() == True:
            rospy.loginfo('bodyhub reset, exit')
        else:
            rospy.loginfo('exit')

    def bodyhub_ready(self):
        if self.bodyhub.ready() == False:
            rospy.logerr('bodyhub to ready failed!')
            rospy.signal_shutdown('error')
            time.sleep(1)
            exit(1)

    def bodyhub_walk(self):
        if self.bodyhub.walk() == False:
            rospy.logerr('bodyhub to walk failed!')
            rospy.signal_shutdown('error')
            time.sleep(1)
            exit(1)

    def start(self):
        print('action start')


class ForwardStep(Action):
    def __init__(self):
        super(ForwardStep, self).__init__('forward_step', 2)
        rospy.Subscriber('terminate_current_process', String, terminate)

    def walk_forward_step(self):
        # 前进一步
        # x为正值表示前进，y=0表示不左右移动，theta=0表示不旋转
        self.bodyhub.walking(-0.1, 0.0, 0.0)
        self.bodyhub.wait_walking_done()

    def start(self):
        self.bodyhub_walk()
        self.walk_forward_step()
        rospy.signal_shutdown('exit')


if __name__ == '__main__':
    ForwardStep().start()