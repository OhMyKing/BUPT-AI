#!/usr/bin/env python
# coding=utf-8

from lejulib import *
import rospy


def main():
    node_initial()

    try:
        shake_head_frames = [([0,0,0,0,0,0,0,0,0,0,0,0,0,-61,-18,0,61,18,0,0,0,0],1000,0),([0,0,0,0,0,0,0,0,0,0,0,0,7,-49,-24,7,49,24,0,0,-24,0],400,200),([0,0,0,0,0,0,0,0,0,0,0,0,-7,-49,-24,-7,49,24,0,0,24,0],600,300),([0,0,0,0,0,0,0,0,0,0,0,0,7,-49,-24,7,49,24,0,0,-24,0],600,300),([0,0,0,0,0,0,0,0,0,0,0,0,0,-61,-18,0,61,18,0,0,0,0],500,0)]
        client_action.action(shake_head_frames)
        rospy.signal_shutdown("done")
        rospy.spin()


    except Exception as err:
        serror(err)

if __name__ == '__main__':
    main()