import sys
import rospkg
import rospy
from motion.motionControl import ResetBodyhub, WaitForWalkingDone

try:
    sys.path.append(rospkg.RosPack().get_path('leju_lib_pkg'))
    from ik_lib.ikmodulesim import IkModuleSim
    from ik_lib.ikmodulesim.CtrlType import CtrlType as C
    import motion.bodyhub_client as bodycli
    HAS_IK_MODULE = True
except (ImportError, rospkg.ResourceNotFound) as e:
    print(f"警告: IK模块导入失败: {e}")
    print("举手功能将被禁用")
    HAS_IK_MODULE = False


class IKController(IkModuleSim, bodycli.BodyhubClient):
    def __init__(self, control_id):
        IkModuleSim.__init__(self)
        # 使用不同的控制ID (6而非2)
        bodycli.BodyhubClient.__init__(self, 6)
        self.walking_id = control_id  # 保存行走控制ID
        
    def raise_hand(self):
        """机器人举手动作"""
        rospy.loginfo("正在执行举手动作...")
        
        try:
            # 确保停止行走并等待
            WaitForWalkingDone()
            # 释放bodyhub控制权
            ResetBodyhub()
            rospy.sleep(1.0)
                
            # 重置姿态
            self.reset()
            if not self.toInitPoses():
                rospy.logerr("无法初始化姿势，取消举手动作")
                return False
            rospy.loginfo("开始第一步动作...")
            self.body_motion([C.RArm_z, C.RArm_x], [0.165, 0.074], 20)
            rospy.loginfo("开始第二步动作...")
            self.body_motion([C.RArm_x, C.RArm_y], [0.073, 0.008], 30)
            rospy.sleep(2.0)
            rospy.loginfo("开始第三步动作...")
            self.body_motion([C.RArm_z, C.RArm_x], [0.05, -0.02], 20)
            rospy.loginfo("开始第四步动作...")
            self.body_motion([C.RArm_z, C.RArm_x], [-0.05, -0.05], 20)
            rospy.loginfo("举手动作完成")
            return True
            
        except Exception as e:
            rospy.logerr(f"举手动作执行出错: {e}")
            return False
        finally:
            # 释放控制权
            self.reset()
            ResetBodyhub()
            rospy.sleep(1.0)
