from dbutils.pooled_db import PooledDB
import pymysql
from flask import current_app
import logging
from contextlib import contextmanager

class Database:
    def __init__(self):
        self.pool = PooledDB(
            creator=pymysql,
            maxconnections=current_app.config['pool']['max-connections'],
            mincached=current_app.config['pool']['min_cached'],
            maxcached=current_app.config['pool']['max_cached'],
            blocking=current_app.config['pool']['blocking'],
            host=current_app.config['db']['host'],
            user=current_app.config['db']['user'],
            passwd=str(current_app.config['db']['password']),
            db=current_app.config['db']['name'],
            port=current_app.config['db']['port'],
            charset=current_app.config['db']['charset'],
            reset=True,
            setsession=[],
            ping=1,  # 开启自动ping
            maxusage=current_app.config['pool']['max_usage']
        )

    @contextmanager
    def get_cursor(self):
        """获取数据库连接和游标的上下文管理器"""
        conn = None
        cursor = None
        try:
            conn = self.pool.connection()
            cursor = conn.cursor(pymysql.cursors.DictCursor)
            yield cursor
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def execute_query(self, query, params=None):
        """执行查询并返回结果"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                with self.get_cursor() as cursor:
                    cursor.execute(query, params)
                    return cursor.fetchall()
            except Exception as e:
                if attempt == max_retries - 1:
                    logging.error(f"查询执行失败 (尝试 {attempt + 1}/{max_retries}): {str(e)}")
                    raise Exception(f"数据库操作失败: {str(e)}")
                continue

    def execute_update(self, query, params=None):
        """执行更新操作"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                with self.get_cursor() as cursor:
                    cursor.execute(query, params)
                    return cursor.rowcount
            except Exception as e:
                if attempt == max_retries - 1:
                    logging.error(f"更新执行失败 (尝试 {attempt + 1}/{max_retries}): {str(e)}")
                    raise Exception(f"数据库操作失败: {str(e)}")
                continue

    def execute_insert(self, query, params=None):
        """执行插入操作并返回最后插入的ID"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                with self.get_cursor() as cursor:
                    cursor.execute(query, params)
                    return cursor.lastrowid
            except Exception as e:
                if attempt == max_retries - 1:
                    logging.error(f"插入执行失败 (尝试 {attempt + 1}/{max_retries}): {str(e)}")
                    raise Exception(f"数据库操作失败: {str(e)}")
                continue
