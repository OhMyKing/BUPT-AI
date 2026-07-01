-- 机器人健康状态表
CREATE TABLE health_states (
                               id TINYINT PRIMARY KEY,
                               name VARCHAR(50) NOT NULL
);

-- 机器人类型表
CREATE TABLE robot_types (
                             id TINYINT PRIMARY KEY,
                             name VARCHAR(50) NOT NULL
);

-- 流程位置表
CREATE TABLE flow_positions (
                                id TINYINT PRIMARY KEY,
                                name VARCHAR(100) NOT NULL
);

-- 流程依赖关系表（有向图的边）
CREATE TABLE flow_edges (
                            from_position_id TINYINT NOT NULL,
                            to_position_id TINYINT NOT NULL,
                            PRIMARY KEY (from_position_id, to_position_id),
                            FOREIGN KEY (from_position_id) REFERENCES flow_positions(id),
                            FOREIGN KEY (to_position_id) REFERENCES flow_positions(id)
);

-- 关键位置表
CREATE TABLE key_positions (
                               id INT PRIMARY KEY,
                               name VARCHAR(100) NOT NULL,
                               latitude DECIMAL(10, 8) NOT NULL,
                               longitude DECIMAL(11, 8) NOT NULL
);


-- 新生表
CREATE TABLE students (
                          student_id VARCHAR(20) PRIMARY KEY,
                          name VARCHAR(50) NOT NULL,
                          gender CHAR(1) NOT NULL,
                          college VARCHAR(100) NOT NULL,
                          major VARCHAR(100) NOT NULL,
                          dormitory_id INT NOT NULL,
                          phone VARCHAR(20) NOT NULL,
                          wechat_enterprise_id VARCHAR(100) NOT NULL,
                          flow_position_id TINYINT NOT NULL,
                          current_latitude DECIMAL(10, 8),
                          current_longitude DECIMAL(11, 8),
                          FOREIGN KEY (dormitory_id) REFERENCES key_positions(id),
                          FOREIGN KEY (flow_position_id) REFERENCES flow_positions(id)
);

-- 机器人表
CREATE TABLE robots (
                        robot_id VARCHAR(20) PRIMARY KEY,
                        battery_level FLOAT NOT NULL,
                        health_state_id TINYINT NOT NULL,
                        robot_type_id TINYINT NOT NULL,
                        current_latitude DECIMAL(10, 8) NOT NULL,
                        current_longitude DECIMAL(11, 8) NOT NULL,
                        target_latitude DECIMAL(10, 8) NOT NULL,
                        target_longitude DECIMAL(11, 8) NOT NULL,
                        target_position_id INT,
                        flow_position_id TINYINT,
                        following_student_id VARCHAR(20),
                        FOREIGN KEY (health_state_id) REFERENCES health_states(id),
                        FOREIGN KEY (robot_type_id) REFERENCES robot_types(id),
                        FOREIGN KEY (target_position_id) REFERENCES key_positions(id),
                        FOREIGN KEY (flow_position_id) REFERENCES flow_positions(id),
                        FOREIGN KEY (following_student_id) REFERENCES students(student_id)
);

-- 志愿者表
CREATE TABLE volunteers (
                            volunteer_id VARCHAR(20) PRIMARY KEY,
                            name VARCHAR(50) NOT NULL,
                            gender CHAR(1) NOT NULL,
                            current_latitude DECIMAL(10, 8),
                            current_longitude DECIMAL(11, 8)
);

-- 健康状态初始化
INSERT INTO health_states (id, name) VALUES
                                         (0, '不在线'),
                                         (1, '在线'),
                                         (2, '低电量');

-- 机器人类型初始化
INSERT INTO robot_types (id, name) VALUES
                                       (0, '引导机器人'),
                                       (1, '答疑机器人');

-- 流程位置初始化
INSERT INTO flow_positions (id, name) VALUES
                                          (0, '尚未入校'),
                                          (1, '办理入校'),
                                          (2, '办理领取资料'),
                                          (3, '办理宿舍入住');

-- 流程边关系初始化
INSERT INTO flow_edges (from_position_id, to_position_id) VALUES
                                                              (0, 1),
                                                              (1, 2),
                                                              (1, 3),
                                                              (2, 3);

-- 关键位置初始化（GPS坐标需要替换为实际值）
INSERT INTO key_positions (id, name, latitude, longitude) VALUES
                                                              (0, '雁北A', 0, 0),
                                                              (1, '雁北B', 0, 0),
                                                              (2, '雁北C', 0, 0),
                                                              (3, '雁北D1', 0, 0),
                                                              (4, '雁北D2', 0, 0),
                                                              (5, '雁北E', 0, 0),
                                                              (6, '雁南S2', 0, 0),
                                                              (7, '雁南S3', 0, 0),
                                                              (8, '雁南S4', 0, 0),
                                                              (9, '雁南S5', 0, 0),
                                                              (10, '雁南S6', 0, 0),
                                                              (11, '学校大门', 0, 0),
                                                              (12, '人工智能学院资料领取点', 0, 0),
                                                              (13, '计算机学院资料领取点', 0, 0),
                                                              (14, '通信学院资料领取点', 0, 0),
                                                              (15, '现代邮政学院资料领取点', 0, 0),
                                                              (16, '1', 0, 0);