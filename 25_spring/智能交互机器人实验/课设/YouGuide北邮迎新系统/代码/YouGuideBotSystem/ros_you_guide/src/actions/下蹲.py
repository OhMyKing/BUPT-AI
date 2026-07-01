#!/usr/bin/env python
# coding=utf-8

from lejulib import *
import rospy

def main():
    node_initial()

    try:
        squat_frames = [([0,0,0,0,0,0,0,0,0,0,0,0,0,-61,-18,0,61,18,0,0,0,0],1000,100),([0,0,58,-98,-40,0,0,0,-58,98,40,0,0,-49,-24,0,49,24,0,0,0,0],800,600),([0,0,0,0,0,0,0,0,0,0,0,0,0,-61,-18,0,61,18,0,0,0,0],1000,100)]
        client_action.action(squat_frames)
        rospy.signal_shutdown("done")
        rospy.spin()


    except Exception as err:
        serror(err)

if __name__ == '__main__':
    main()