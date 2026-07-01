from flask import current_app

from flask import current_app
from datetime import datetime


def get_week_dispatch_records_from_db():
    """获取近一周调度记录"""
    try:
        # 修正查询语句：使用正确的列名
        query = """
            SELECT RecordTime, 
                   WaitingQueue, 
                   RunningQueue
            FROM schedulerecords
            WHERE RecordTime >= NOW() - INTERVAL 7 DAY
            ORDER BY RecordTime DESC
        """
        # 使用 Database 类的 execute_query 方法执行查询
        results = current_app.db.execute_query(query)
        
        # 创建结果列表，处理每条记录
        formatted_results = []
        for record in results:
            formatted_record = {
                "time": record['RecordTime'].isoformat() + 'Z',
                "waiting_queue": record['WaitingQueue'],
                "running_queue": record['RunningQueue']
            }
            formatted_results.append(formatted_record)

        return formatted_results

    except Exception as e:
        current_app.logger.error(f"获取调度记录时出错: {e}")  # 添加日志
        raise Exception(f"获取调度记录时出错: {e}")