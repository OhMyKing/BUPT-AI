from mappers.aircon_mapper import update_central_aircon_settings
from mappers.aircon_mapper import get_all_aircon_status
from mappers.aircon_mapper import get_weekly_aircon_operations
from mappers.aircon_mapper import update_room_settings, insert_operation_record, get_room_info
from utils.validators import validate_room_id, validate_ac_settings
from utils.scheduler import AirConditioningScheduler


def update_room_ac_settings(room_id, power, temperature, wind_speed, sweep):
    """更新房间空调设置的业务逻辑"""
    try:
        # 获取原始状态
        old_status = get_room_info(room_id)
        
        # 参数验证
        validate_room_id(room_id)
        validate_ac_settings(power, temperature, wind_speed, sweep)

        # 更新房间设置
        settings = {
            'power': power,
            'temperature': temperature,
            'wind_speed': wind_speed,
            'sweep': sweep
        }
        update_room_settings(room_id, settings)

        # 记录操作历史
        insert_operation_record(room_id, power, temperature, wind_speed, sweep)
        
        # 如果开关机状态或风速发生变化，触发调度
        # if (old_status['power'] != power or 
            # (old_status['wind_speed'] != wind_speed and power == 'on')):
            # scheduler = AirConditioningScheduler()
            # scheduler.schedule()
            
    except Exception as e:
        raise Exception(f"更新房间设置失败: {str(e)}")


def get_room_panel_info(room_id):
    """获取房间面板信息的业务逻辑"""
    # 验证房间号
    validate_room_id(room_id)

    # 获取房间数据
    room_data = get_room_info(room_id)
    if not room_data:
        raise ValueError("房间不存在")

    # 转换为API响应格式
    return {
        "roomTemperature": room_data["room_temperature"],
        "power": room_data["power"],
        "temperature": room_data["target_temperature"],
        "windSpeed": room_data["wind_speed"],
        "mode": room_data["mode"],
        "sweep": room_data["sweep"],
        "cost": float(room_data["current_energy"]),
        "money": float(room_data["current_money"]),
        "totalCost": float(room_data["total_energy"]),
        "totalMoney": float(room_data["total_money"])
    }

def adjust_central_aircon_settings(data):
    """
    调整中央空调设置的业务逻辑
    """
    required_fields = ['mode', 'resourceLimit', 'fanRates']
    for field in required_fields:
        if field not in data:
            return {"code": 1, "message": f"缺少必需参数: {field}"}

    fan_rates = data['fanRates']
    for rate in ['lowSpeedRate', 'midSpeedRate', 'highSpeedRate']:
        if rate not in fan_rates:
            return {"code": 1, "message": f"缺少风速费率参数: {rate}"}

    try:
        update_central_aircon_settings(
            mode=data['mode'],
            max_rooms=data['resourceLimit'],
            fan_rates=fan_rates
        )
        return {"code": 0, "message": "中央空调设置成功"}
    except Exception as e:
        return {"code": 1, "message": f"设置失败: {str(e)}"}


def fetch_all_aircon_status():
    """获取所有房间空调状态的业务逻辑"""
    try:
        # 获取查询结果
        aircon_status = get_all_aircon_status()

        # 将字段名和类型严格与示例保持一致
        result = []
        for status in aircon_status:
            result.append({
                "roomId": status["roomId"],
                "roomTemperature": status["roomTemperature"],
                "power": status["power"],
                "temperature": status["temperature"],
                "windSpeed": status["windSpeed"],
                "mode": status["mode"],
                "sweep": status["sweep"],
                "cost": float(status["cost"]),
                "totalCost": float(status["totalCost"]),
                "status": status["status"],
                "timeSlice": status["timeSlice"]
            })

        return {"code": 0, "message": "查询成功", "data": result}

    except Exception as e:
        return {"code": 1, "message": f"查询失败: {str(e)}", "data": []}


def fetch_weekly_aircon_operations():
    """
    获取过去一周的空调操作记录
    """
    try:
        records = get_weekly_aircon_operations()

        # 将字段名和类型调整为接口要求格式
        result = []
        for record in records:
            result.append({
                "roomId": record["roomId"],
                "time": record["time"].isoformat(),  # ISO8601 格式
                "cost": float(record["cost"]),
                "energyCost": float(record["energyCost"]),
                "power": record["power"],
                "temperature": record["temperature"],
                "windSpeed": record["windSpeed"],
                "mode": record["mode"],
                "sweep": record["sweep"],
                "status": record["status"],
                "timeSlice": record["timeSlice"]
            })

        return {"code": 0, "message": "查询成功", "data": result}

    except Exception as e:
        return {"code": 1, "message": f"查询失败: {str(e)}", "data": []}
