# CREATE TABLE TaskInfo (
#                           task_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '任务唯一标识',
#                           model_name VARCHAR(255) NOT NULL COMMENT '模型名称',
#                           model_params INT NOT NULL COMMENT '模型参数量',
#                           model_vendor VARCHAR(255) COMMENT '模型厂商',
#                           additional_info TEXT COMMENT '补充信息',
#                           api_key VARCHAR(255) NOT NULL COMMENT 'API 密钥',
#                           task_created_at DATETIME NOT NULL COMMENT '任务创建时间',
#                           task_status TINYINT NOT NULL DEFAULT 0 COMMENT '任务状态 0 初始化 1 进行中 2 已完成 3 异常',
#                           task_report_pdf LONGBLOB COMMENT '任务报告 PDF 文件'
# ) COMMENT='大语言模型测试任务表';

CREATE TABLE EnhanceInfo (
                                          enhancement_api_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '增强API唯一标识',
                                          enhancement_model_name VARCHAR(255) NOT NULL COMMENT '增强模型名称',
                                          model_params INT NOT NULL COMMENT '模型参数量',
                                          model_vendor VARCHAR(255) COMMENT '模型厂商',
                                          additional_info TEXT COMMENT '补充信息',
                                          api_status TINYINT NOT NULL DEFAULT 0 COMMENT 'API状态 0 正常 1 欠费 2 异常',
                                          api_quota DECIMAL(10,2) NOT NULL DEFAULT 20.00 COMMENT 'API额度',
                                          api_key VARCHAR(255) NOT NULL COMMENT 'API密钥'
) COMMENT='大模型安全增强表';
