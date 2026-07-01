-- 删除现有表（如果存在）
DROP TABLE IF EXISTS dish_flavor;
DROP TABLE IF EXISTS dish;
DROP TABLE IF EXISTS category;
CREATE TABLE category (
                          id BIGINT PRIMARY KEY AUTO_INCREMENT,
                          type INT NOT NULL COMMENT '类型 1 菜品分类 2 套餐分类',
                          name VARCHAR(32) NOT NULL COMMENT '分类名称',
                          sort INT NOT NULL COMMENT '顺序',
                          status INT NOT NULL COMMENT '分类状态 0:禁用，1:启用',
                          create_time DATETIME NOT NULL COMMENT '创建时间',
                          update_time DATETIME NOT NULL COMMENT '更新时间',
                          create_user BIGINT NOT NULL COMMENT '创建人',
                          update_user BIGINT NOT NULL COMMENT '修改人'
);

CREATE TABLE dish (
                      id BIGINT PRIMARY KEY AUTO_INCREMENT,
                      name VARCHAR(32) NOT NULL COMMENT '菜品名称',
                      category_id BIGINT NOT NULL COMMENT '菜品分类id',
                      price DECIMAL(10,2) NOT NULL COMMENT '菜品价格',
                      image VARCHAR(255) COMMENT '图片',
                      description VARCHAR(255) COMMENT '描述信息',
                      status INT NOT NULL COMMENT '0 停售 1 起售',
                      create_time DATETIME NOT NULL COMMENT '创建时间',
                      update_time DATETIME NOT NULL COMMENT '更新时间',
                      create_user BIGINT NOT NULL COMMENT '创建人',
                      update_user BIGINT NOT NULL COMMENT '修改人',
                      FOREIGN KEY (category_id) REFERENCES category(id)
);

CREATE TABLE dish_flavor (
                             id BIGINT PRIMARY KEY AUTO_INCREMENT,
                             dish_id BIGINT NOT NULL COMMENT '菜品',
                             name VARCHAR(32) NOT NULL COMMENT '口味名称',
                             value VARCHAR(255) NOT NULL COMMENT '口味数据list',
                             FOREIGN KEY (dish_id) REFERENCES dish(id)
);

