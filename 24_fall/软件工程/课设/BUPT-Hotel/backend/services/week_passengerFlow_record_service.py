from mappers.week_passengerFlow_record_mapper import get_week_passengerFlow_records_from_db

def get_week_passengerFlow_records():
    """获取近一周客流记录的业务逻辑"""

    # 从数据库获取客流记录
    records = get_week_passengerFlow_records_from_db()

    if not records:
        return []  # 返回一个空列表，表示没有记录

    # 处理记录以符合返回结构
    formatted_records = []
    for record in records:
        formatted_records.append({
            "time": record['time'],              # 记录时间
            "operation": record['recordType'],  # 记录类型（入住或退房）
            "roomId": record['roomID'],          # 房间ID
            
        })

    return formatted_records