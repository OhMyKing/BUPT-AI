-- 菜单 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('新生管理', '2000', '1', 'students', 'system/students/index', 1, 0, 'C', '0', '0', 'system:students:list', '#', 'admin', sysdate(), '', null, '新生管理菜单');

-- 按钮父菜单ID
SELECT @parentId := LAST_INSERT_ID();

-- 按钮 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('新生管理查询', @parentId, '1',  '#', '', 1, 0, 'F', '0', '0', 'system:students:query',        '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('新生管理新增', @parentId, '2',  '#', '', 1, 0, 'F', '0', '0', 'system:students:add',          '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('新生管理修改', @parentId, '3',  '#', '', 1, 0, 'F', '0', '0', 'system:students:edit',         '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('新生管理删除', @parentId, '4',  '#', '', 1, 0, 'F', '0', '0', 'system:students:remove',       '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('新生管理导出', @parentId, '5',  '#', '', 1, 0, 'F', '0', '0', 'system:students:export',       '#', 'admin', sysdate(), '', null, '');