from collections import OrderedDict
import json
from flask import current_app, jsonify, request

def add_schedule():
    try:
        # 获取请求数据
        data = request.get_json()
        running = data.get('running', [])
        waiting = data.get('waiting', [])
        
        # 获取当前时间
        from datetime import datetime
        current_time = datetime.now()
        
        # 构建插入SQL
        insert_sql = """
            INSERT INTO schedulerecords 
            (WaitingQueue, RunningQueue, RecordTime) 
            VALUES (%s, %s, %s)
        """
        
        # 执行插入
        params = (
            json.dumps(waiting),
            json.dumps(running),
            current_time
        )
        current_app.db.execute_query(insert_sql, params)

        response = OrderedDict([
            ("code", 0),
            ("message", "添加成功")
        ])

        return jsonify(response), 200

    except Exception as e:
        raise Exception(f"添加调度记录失败: {str(e)}")

def insert_heat_schedule_records():
    # 准备测试数据
    records = [
        ([2001], []),
        ([2001, 2002], []),
        ([2001, 2002, 2003], []),
        ([2001, 2002, 2003], [2004, 2005]),
        ([2005, 2002, 2003], [2004, 2001]),
        ([2005, 2001, 2004], [2003, 2002]),
        ([2005, 2001, 2004], [2003, 2002]),
        ([2005, 2001, 2004], [2004, 2002]),
        ([2005, 2001, 2003], [2004, 2002]),
        ([2005, 2001, 2004], [2003, 2002]),
        ([2005, 2001, 2004], [2003, 2002]),
        ([2002, 2001, 2004], [2003, 2005]),
        ([2002, 2001, 2004], [2003, 2005]),
        ([2002, 2001, 2004], [2003]),
        ([2002, 2005, 2004], [2003]),
        ([2002, 2005, 2004], [2003]),
        ([2002, 2003, 2004], []),
        ([2002, 2003, 2004], []),
        ([2002, 2003, 2001], [2004]),
        ([2004, 2003, 2005], [2, 2001]),
        ([2004, 2003, 2005], [2, 2001]),
        ([2002, 2003, 2001], [2004, 2005]),
        ([2002, 2003, 2001], [2004, 2005]),
        ([2002, 2004], [])
    ]

    try:
        # 清空表
        clear_sql = "TRUNCATE TABLE schedulerecords"
        current_app.db.execute_query(clear_sql)

        # 获取当前时间作为最后一条记录的时间
        from datetime import datetime, timedelta
        end_time = datetime.now()
        
        # 构建插入SQL
        insert_sql = """
            INSERT INTO schedulerecords 
            (WaitingQueue, RunningQueue, RecordTime) 
            VALUES (%s, %s, %s)
        """
        
        # 从后向前计算时间，每条记录间隔10秒
        for i, (running, waiting) in enumerate(reversed(records)):
            record_time = end_time - timedelta(seconds=i*10)
            params = (
                json.dumps(waiting),
                json.dumps(running),
                record_time
            )
            current_app.db.execute_query(insert_sql, params)

        response = OrderedDict([
            ("code", 0),
            ("message", "查询成功")
        ])

        return jsonify(response), 200

    except Exception as e:
        raise Exception(f"插入调度记录失败: {str(e)}")
    

def insert_cold_schedule_records():
    # 准备测试数据 - [运行队列(最大3)], [等待队列]
    records = [
        ([2001], []),
        ([2001, 2002, 2005], []),
        ([2001, 2002, 2005], [2003]),
        ([2001, 2002, 2005], [2003, 2004]),
        ([2002, 2005, 2003], [2004, 2001]),
        ([2003, 2004, 2001], [2002, 2005]),
        ([2003, 2004, 2001], [2005]),
        ([2004, 2001, 2005], [2002, 2003]),
        ([2004, 2001, 2005], [2002, 2003]),
        ([2001, 2005, 2004], [2002, 2003]),
        ([2001, 2005, 2004], [2002, 2003]),
        ([2001, 2005, 2004], [2002, 2003]),
        ([2002, 2001, 2004], [2003, 2005]),
        ([2003, 2001, 2004], [2002, 2005]),
        ([2002, 2005, 2004], [2003]),
        ([2002, 2004, 2005], [2003]),
        ([2003, 2005, 2004], []),
        ([2003, 2005, 2004], []),
        ([2003, 2005], []),
        ([2002, 2003, 2005], []),
        ([2002, 2003], []),
        ([2002, 2003], []),
        ([2002], []),
        ([2002, 2001], []),
        ([2002, 2004], [])
    ]

    try:
        # 清空表
        clear_sql = "TRUNCATE TABLE schedulerecords"
        current_app.db.execute_query(clear_sql)

        # 获取当前时间作为最后一条记录的时间
        from datetime import datetime, timedelta
        end_time = datetime.now()
        
        # 构建插入SQL
        insert_sql = """
            INSERT INTO schedulerecords 
            (WaitingQueue, RunningQueue, RecordTime) 
            VALUES (%s, %s, %s)
        """
        
        # 从后向前计算时间，每条记录间隔10秒
        for i, (running, waiting) in enumerate(reversed(records)):
            record_time = end_time - timedelta(seconds=i*10)
            params = (
                json.dumps(waiting),
                json.dumps(running),
                record_time
            )
            current_app.db.execute_query(insert_sql, params)

        response = OrderedDict([
            ("code", 0),
            ("message", "查询成功"),
        ])

        return jsonify(response), 200

    except Exception as e:
        raise Exception(f"插入调度记录失败: {str(e)}")