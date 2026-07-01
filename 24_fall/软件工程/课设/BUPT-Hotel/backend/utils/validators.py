def validate_room_id(room_id):
    """验证房间号"""
    if not room_id or not isinstance(room_id, int) or not (2001 <= room_id <= 5010):
        raise ValueError("无效的房间号")


def validate_ac_settings(power, temperature, wind_speed, sweep):
    """验证空调设置参数"""
    # 验证电源状态
    if power not in ["on", "off"]:
        raise ValueError("无效的开关状态")

    # 验证温度
    if not (16 <= temperature <= 30):
        raise ValueError("温度范围应在16到30之间")

    # 验证风速
    if wind_speed not in ["低", "中", "高"]:
        raise ValueError("无效的风速值")

    # 验证扫风设置
    if sweep not in ["开", "关"]:
        raise ValueError("无效的扫风设置")