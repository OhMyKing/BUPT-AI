sleep 3s

rosrun  ik_module ik_module_node &

source /home/bupt/robot_ros_ubuntu_20/catkin_ws/devel/setup.bash
echo "123456" | sudo -S bash roslaunch.sh &