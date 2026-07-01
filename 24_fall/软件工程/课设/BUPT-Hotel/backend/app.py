import threading
from flask import Flask
from flask_cors import CORS
from controllers.week_air_controller import insert_heat_schedule_records, insert_cold_schedule_records, add_schedule
from utils.config_utils import Config
from utils.database_utils import Database
from controllers.aircon_controller import update_ac_controller, get_panel_controller
from controllers.stage_controller import get_room_record
from controllers.login_controller import admin_login_controller
from controllers.aircon_controller import central_aircon_adjust_controller
from controllers.aircon_controller import get_hotel_aircon_status_controller
from controllers.aircon_controller import get_weekly_aircon_operations_controller
from controllers.front_desk_controller import get_hotel_info, hotel_check_in, hotel_check_out
from controllers.week_dispatch_record_controller import week_dispatch_record_controller
from controllers.week_passengerFlow_record_controller import week_passengerFlow_record_controller
from controllers.room_information_controller import query_room_controller  # 导入房间信息控制器
from utils.scheduler import run_scheduler
from utils.warmup import warmup

app = Flask(__name__)
config = Config('./config/config.yaml')
config.to_flask_config(app)
with app.app_context():
    app.db = Database()
CORS(app, resources={r"/*": {"origins": "*"}})  # 允许所有来源

app.add_url_rule('/admin/login', 'admin_login', admin_login_controller, methods=['POST'])
app.add_url_rule('/aircon/control', 'control_aircon', update_ac_controller, methods=['POST'])
app.add_url_rule('/aircon/panel', 'get_room_panel', get_panel_controller, methods=['GET'])
app.add_url_rule('/stage/record', 'get_room_record', get_room_record, methods=['GET'])

# 获取整个酒店入住情况接口
app.add_url_rule('/stage/query', 'get_hotel_info', get_hotel_info, methods=['POST'])
# 办理入住接口
app.add_url_rule('/stage/add', 'hotel_check_in', hotel_check_in, methods=['POST'])
# 办理退房接口
app.add_url_rule('/stage/delete', 'hotel_check_out', hotel_check_out, methods=['GET'])
# 添加路由
app.add_url_rule('/admin/login', 'admin_login', admin_login_controller, methods=['POST'])
app.add_url_rule('/admin/query_schedule', 'week_dispatch_record', week_dispatch_record_controller, methods=['GET'])
app.add_url_rule('/admin/query_people', 'week_passenger_flow', week_passengerFlow_record_controller, methods=['GET'])
app.add_url_rule('/admin/query_room', 'query_room', query_room_controller, methods=['POST'])
app.add_url_rule('/admin/insert_heat_schedule', 'insert_heat_schedule', insert_heat_schedule_records, methods=['GET'])
app.add_url_rule('/admin/insert_cold_schedule', 'insert_cold_schedule', insert_cold_schedule_records, methods=['GET'])
# 中央空调设置路由
app.add_url_rule(
    '/central-aircon/adjust',
    'central_aircon_adjust',
    central_aircon_adjust_controller,
    methods=['POST']
)

# 注册获取空调状态路由
app.add_url_rule(
    '/aircon/status',
    'get_hotel_aircon_status',
    get_hotel_aircon_status_controller,
    methods=['GET']
)

app.add_url_rule(
    '/admin/query_ac',
    'get_weekly_aircon_operations',
    get_weekly_aircon_operations_controller,
    methods=['GET']
)

app.add_url_rule('/admin/add_schedule', 'add_schedule', add_schedule, methods=['POST'])

if __name__ == "__main__":
    warmup_thread = threading.Thread(target=warmup, daemon=True)
    warmup_thread.start()
    # scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    # scheduler_thread.start()

    # 启动 Flask 应用
    # app.debug = True
    app.run(host="0.0.0.0", port=5004)