create table Customers
(
    CustomerID   int auto_increment
        primary key,
    CustomerName varchar(100)                       not null,
    CreateTime   datetime default CURRENT_TIMESTAMP not null,
    UpdateTime   datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    RoomID       int                                null,
    constraint fk_customer_room
        foreign key (RoomID) references bupt_hotel.Rooms (RoomID)
)
    collate = utf8mb4_general_ci;

create index idx_customer_name
    on Customers (CustomerName);

create table administrators
(
    AdminID      int auto_increment
        primary key,
    Username     varchar(100)                              not null,
    PasswordHash varchar(255)                              not null,
    Role         enum ('前台服务', '空调管理', '酒店经理') not null,
    CreateTime   datetime default CURRENT_TIMESTAMP        not null,
    constraint Username
        unique (Username)
)
    collate = utf8mb4_general_ci;

create index idx_username
    on administrators (Username);

create table centralac
(
    ACID          int                     default 1                 not null
        primary key,
    Status        enum ('运行中', '关闭') default '关闭'            not null,
    Mode          tinyint                                           not null,
    MaxRooms      int                     default 3                 not null,
    LowSpeedRate  decimal(10, 2)                                    not null,
    MidSpeedRate  decimal(10, 2)                                    not null,
    HighSpeedRate decimal(10, 2)                                    not null,
    UpdateTime    datetime                default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    check (`Mode` in (0, 1)),
    constraint single_central_ac
        check (`ACID` = 1)
)
    collate = utf8mb4_general_ci;

create table operationrecords
(
    RecordID      bigint auto_increment
        primary key,
    RoomID        int                     not null,
    RecordTime    datetime                not null,
    Power         enum ('on', 'off')      not null,
    Temperature   tinyint                 null,
    WindSpeed     enum ('低', '中', '高') not null,
    Mode          enum ('制冷', '制热')   not null,
    Sweep         enum ('关', '开')       not null,
    CurrentEnergy decimal(10, 2)          not null,
    CurrentCost   decimal(10, 2)          not null,
    Status        tinyint default 2       not null,
    TimeSlice     int     default 0       not null,
    constraint operationrecords_ibfk_1
        foreign key (RoomID) references bupt_hotel.rooms (RoomID),
    check (`Temperature` between 16 and 30),
    check (`Status` in (0, 1, 2))
)
    collate = utf8mb4_general_ci;

create index idx_room_time
    on operationrecords (RoomID, RecordTime);

create index idx_time
    on operationrecords (RecordTime);

create table rooms
(
    RoomID                 int                                   not null
        primary key,
    RoomLevel              enum ('标准间', '大床房')             not null,
    RoomTemperature        float                                 null,
    TargetTemperature      tinyint                               null,
    EnvironmentTemperature tinyint                               null,
    TotalAmount            decimal(10, 2)          default 0.00  not null,
    TotalEnergyConsumption decimal(10, 2)          default 0.00  not null,
    CurrentEnergy          decimal(10, 2)          default 0.00  not null,
    Power                  enum ('on', 'off')      default 'off' not null,
    RoomWindSpeed          enum ('低', '中', '高') default '低'  not null,
    RoomMode               enum ('制冷', '制热')                 not null,
    RoomSweep              enum ('关', '开')       default '关'  not null,
    Status                 tinyint                 default 2     not null,
    TimeSlice              int                     default 0     not null,
    CheckInTime            datetime                              null,
    LastOperationTime      datetime                              null,
    check (`RoomID` between 2001 and 5010),
    check (`RoomTemperature` between 16 and 30),
    check (`TargetTemperature` between 16 and 30),
    check (`Status` in (0, 1, 2))
)
    collate = utf8mb4_general_ci;

create index idx_power
    on rooms (Power);

create index idx_status
    on rooms (Status);

create table schedulerecords
(
    ScheduleID   bigint auto_increment
        primary key,
    WaitingQueue json     not null,
    RunningQueue json     not null,
    RecordTime   datetime not null,
    constraint check_running_queue
        check (json_valid(`RunningQueue`)),
    constraint check_waiting_queue
        check (json_valid(`WaitingQueue`))
)
    collate = utf8mb4_general_ci;

create index idx_time
    on schedulerecords (RecordTime);

create table trafficrecords
(
    RecordID   bigint auto_increment
        primary key,
    RecordType enum ('退房', '入住') not null,
    RoomID     int                   not null,
    CustomerID int                   not null,
    RecordTime datetime              not null,
    constraint trafficrecords_ibfk_1
        foreign key (RoomID) references bupt_hotel.rooms (RoomID),
    constraint trafficrecords_ibfk_2
        foreign key (CustomerID) references bupt_hotel.customers (CustomerID)
)
    collate = utf8mb4_general_ci;

create index CustomerID
    on trafficrecords (CustomerID);

create index idx_room_time
    on trafficrecords (RoomID, RecordTime);

create index idx_time
    on trafficrecords (RecordTime);

