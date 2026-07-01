from flask import current_app

def get_week_passengerFlow_records_from_db():
    """获取近一周客流记录"""
    try:
        query = """
            SELECT RecordTime, RecordType, RoomID, CustomerID
            FROM TrafficRecords
            WHERE RecordTime >= NOW() - INTERVAL 7 DAY
            ORDER BY RecordTime DESC
        """
        results = current_app.db.execute_query(query)
        
        formatted_results = []
        for result in results:
            formatted_results.append({
                "time": result['RecordTime'].isoformat() + 'Z',
                "recordType": result['RecordType'],
                "roomID": result['RoomID'],
                "customerID": result['CustomerID']
            })

        return formatted_results

    except Exception as e:
        raise Exception(f"获取客流记录时出错: {e}")