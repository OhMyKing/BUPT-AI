import json
from mappers.week_dispatch_record_mapper import get_week_dispatch_records_from_db

def get_week_dispatch_records():
    records = get_week_dispatch_records_from_db()
    
    return {
        "code": 0,
        "message": "查询成功",
        "data": records if records else []
    }