from datetime import datetime
import time
from typing import List, Dict
import json
import pymysql
from utils.warmup import db_config  # 复用warmup中的数据库配置

def get_db_connection():
    return pymysql.connect(
        host=db_config['host'],
        user=db_config['user'],
        password=db_config['password'],
        database=db_config['database'],
        port=db_config['port'],
        cursorclass=pymysql.cursors.DictCursor
    )

class AirConditioningScheduler:
    def __init__(self):
        self.waiting_queue = []   # [{'RoomID':..., 'WindSpeed':..., 'waiting_timer':...}]
        self.service_queue = []   # [{'RoomID':..., 'WindSpeed':..., 'service_time':...}]
        self.temp_queue = []      # [{'RoomID':..., 'WindSpeed':..., 'temp_timer':...}]
        
        self.last_waiting_rooms = set()
        self.last_service_rooms = set()
        
        self.max_service = 3      # 服务队列最大长度
        self.connection = None
        self.last_schedule_time = None  # 上次调度的时间戳，用于计算实际经过的时间

    def _connect_db(self):
        if not self.connection or not self.connection.open:
            self.connection = get_db_connection()

    def _close_db(self):
        if self.connection:
            self.connection.close()
            self.connection = None

    def _get_all_rooms(self):
        query = """
            SELECT RoomID, Power, RoomTemperature, TargetTemperature, RoomWindSpeed,
                   Status, TimeSlice, LastOperationTime
            FROM rooms
        """
        with self.connection.cursor() as cursor:
            cursor.execute(query)
            rooms = cursor.fetchall()
        rooms_dict = {r['RoomID']: r for r in rooms}
        return rooms_dict

    def _update_room_status(self, room_id, status, time_slice=20):
        query = """
            UPDATE rooms
            SET Status = %s,
                TimeSlice = %s,
                LastOperationTime = NOW()
            WHERE RoomID = %s
        """
        with self.connection.cursor() as cursor:
            cursor.execute(query, (status, time_slice, room_id))
        self.connection.commit()

    def _insert_schedule_record(self, waiting_list, service_list):
        query = """
            INSERT INTO schedulerecords (WaitingQueue, RunningQueue, RecordTime)
            VALUES (%s, %s, NOW())
        """
        waiting_json = json.dumps([w['RoomID'] for w in waiting_list])
        service_json = json.dumps([s['RoomID'] for s in service_list])
        with self.connection.cursor() as cursor:
            cursor.execute(query, (waiting_json, service_json))
        self.connection.commit()

    def _wind_speed_priority(self, wind_speed):
        mapping = {'低': 1, '中': 2, '高': 3}
        return mapping.get(wind_speed, 0)
    
    def _get_elapsed(self):
        # 计算本次调度与上次调度间隔的秒数
        now = datetime.now()
        if self.last_schedule_time is None:
            self.last_schedule_time = now
            return 0.0
        elapsed = (now - self.last_schedule_time).total_seconds()
        self.last_schedule_time = now
        return elapsed

    def _print_queues(self, msg):
        print("--------")
        print(msg)
        print("Waiting Queue:", self.waiting_queue)
        print("Service Queue:", self.service_queue)
        print("Temp Queue:", self.temp_queue)
        print("--------")

    def schedule(self):
        try:
            self._connect_db()
            rooms_dict = self._get_all_rooms()

            # 计算本次调度与上次调度的时间差（秒）
            elapsed = self._get_elapsed()
            # print(f"[INFO] 调度开始，距离上次调度已过去 {elapsed:.2f} 秒")

            # 更新定时器
            for s in self.service_queue:
                s['service_time'] += elapsed
            for w in self.waiting_queue:
                w['waiting_timer'] -= elapsed
            for t in self.temp_queue:
                t['temp_timer'] -= elapsed
            
            # self._print_queues("初始队列状态(更新定时器后)")

            # -----------------------------------------------------
            # 2. 调度前准备
            # -----------------------------------------------------
            # 清理关机房间
            all_queue_room_ids = {r['RoomID'] for r in self.waiting_queue} \
                                | {r['RoomID'] for r in self.service_queue} \
                                | {r['RoomID'] for r in self.temp_queue}
            for rid in list(all_queue_room_ids):
                room = rooms_dict.get(rid)
                if room is None or room['Power'] == 'off':
                    # print(f"[INFO] 房间{rid}关机或无效，从所有队列中移除")
                    self.waiting_queue = [r for r in self.waiting_queue if r['RoomID'] != rid]
                    self.service_queue = [r for r in self.service_queue if r['RoomID'] != rid]
                    self.temp_queue = [r for r in self.temp_queue if r['RoomID'] != rid]

            # self._print_queues("清理关机房间后队列状态")

            # 新开机房间分配
            active_rooms = [r for r in rooms_dict.values() if r['Power'] == 'on']
            queued_rooms = {r['RoomID'] for r in self.waiting_queue} \
                           | {r['RoomID'] for r in self.service_queue} \
                           | {r['RoomID'] for r in self.temp_queue}
            
            for room in active_rooms:
                if room['RoomID'] not in queued_rooms:
                    if len(self.service_queue) < self.max_service:
                        self.service_queue.append({
                            'RoomID': room['RoomID'],
                            'WindSpeed': room['RoomWindSpeed'],
                            'service_time': 0.0
                        })
                        self._update_room_status(room['RoomID'], 1, 20)
                        # print(f"[INFO] 新开机房间{room['RoomID']}直接进入服务队列")
                    else:
                        self.waiting_queue.append({
                            'RoomID': room['RoomID'],
                            'WindSpeed': room['RoomWindSpeed'],
                            'waiting_timer': 20.0
                        })
                        self._update_room_status(room['RoomID'], 0, 20)
                        # print(f"[INFO] 新开机房间{room['RoomID']}服务队列已满，进入等待队列")

            # self._print_queues("新开机房间加入后队列状态")

            # -----------------------------------------------------
            # 3. 对暂存队列和服务队列进行调度
            # -----------------------------------------------------
            # 3.1 检查服务队列中已满足需求的房间
            for s in list(self.service_queue):
                r = rooms_dict[s['RoomID']]
                if r['TargetTemperature'] is not None and r['RoomTemperature'] is not None:
                    if abs(r['RoomTemperature'] - r['TargetTemperature']) <= 0.5:
                        self.service_queue.remove(s)
                        self.temp_queue.append({
                            'RoomID': s['RoomID'],
                            'WindSpeed': s['WindSpeed'],
                            'temp_timer': 20.0
                        })
                        self._update_room_status(s['RoomID'], 2, 20)
                        # print(f"[INFO] 房间{s['RoomID']}已满足目标温度，进入暂存队列")

            # self._print_queues("满足需求房间进入暂存队列后状态")

            # 3.2 暂存队列定时检查
            for t in list(self.temp_queue):
                if t['temp_timer'] <= 0:
                    self.temp_queue.remove(t)
                    if len(self.service_queue) < self.max_service:
                        self.service_queue.append({
                            'RoomID': t['RoomID'],
                            'WindSpeed': t['WindSpeed'],
                            'service_time': 0.0
                        })
                        self._update_room_status(t['RoomID'], 1, 20)
                        # print(f"[INFO] 暂存到期房间{t['RoomID']}重新加入服务队列")
                    else:
                        self.waiting_queue.append({
                            'RoomID': t['RoomID'],
                            'WindSpeed': t['WindSpeed'],
                            'waiting_timer': 20.0
                        })
                        self._update_room_status(t['RoomID'], 0, 20)
                        # print(f"[INFO] 暂存到期房间{t['RoomID']}服务队列已满，重新进入等待队列")

            # self._print_queues("暂存队列处理后状态")

            # -----------------------------------------------------
            # 4. 对等待队列和服务队列进行调度(抢占式)
            # -----------------------------------------------------
            # 4.1 服务队列排序
            self.service_queue.sort(key=lambda x: (self._wind_speed_priority(x['WindSpeed']), -x['service_time']))
            # print("[INFO] 服务队列排序完毕")

            # 4.2 等待队列排序
            self.waiting_queue.sort(key=lambda x: (-self._wind_speed_priority(x['WindSpeed']), x['waiting_timer']))
            # print("[INFO] 等待队列排序完毕")

            # self._print_queues("排序后状态")

            # 4.3 抢占式调度
            if self.waiting_queue and self.service_queue:
                w_head = self.waiting_queue[0]
                s_head = self.service_queue[0]
                w_priority = self._wind_speed_priority(w_head['WindSpeed'])
                s_priority = self._wind_speed_priority(s_head['WindSpeed'])
                
                if w_priority > s_priority:
                    waiting_id = w_head['RoomID']
                    service_id = s_head['RoomID']
                    
                    # 移除队首元素
                    self.waiting_queue.pop(0)
                    self.service_queue.pop(0)
                    
                    # 服务队首被抢占下去进入等待队列
                    self.waiting_queue.append({
                        'RoomID': service_id,
                        'WindSpeed': s_head['WindSpeed'],
                        'waiting_timer': 20.0
                    })
                    self._update_room_status(service_id, 0, 20)
                    
                    # 等待队首上来提供服务
                    self.service_queue.append({
                        'RoomID': waiting_id,
                        'WindSpeed': w_head['WindSpeed'],
                        'service_time': 0.0
                    })
                    self._update_room_status(waiting_id, 1, 20)
                    # print(f"[INFO] 房间{waiting_id}风速更高，抢占房间{service_id}的位置")

            # self._print_queues("抢占式调度后状态")

            # 4.4 写入调度记录（如有变化）
            current_waiting_set = {w['RoomID'] for w in self.waiting_queue}
            current_service_set = {s['RoomID'] for s in self.service_queue}
            
            if not (current_waiting_set == self.last_waiting_rooms and current_service_set == self.last_service_rooms):
                self._insert_schedule_record(self.waiting_queue, self.service_queue)
                self.last_waiting_rooms = current_waiting_set
                self.last_service_rooms = current_service_set
                # print("[INFO] 当前调度状态已记录至数据库")
            # else:
            #     print("[INFO] 当前调度状态与上次相同，无需记录")

            # print("[INFO] 调度结束")

        except Exception as e:
            print(f"[ERROR] 调度器运行错误: {str(e)}")
            self._close_db()
            raise
        finally:
            if self.connection:
                self._close_db()

def run_scheduler():
    scheduler = AirConditioningScheduler()
    
    while True:
        try:
            scheduler.schedule()
        except Exception as e:
            print(f"调度器运行错误: {str(e)}")
        finally:
            time.sleep(1)  # 每1秒执行一次调度