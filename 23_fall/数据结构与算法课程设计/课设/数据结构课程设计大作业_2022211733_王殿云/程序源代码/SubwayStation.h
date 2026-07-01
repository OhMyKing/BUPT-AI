#pragma once
#include <string>
#include <iostream>
#include <vector>

// 结构用于存储地铁站点信息
struct SubwayStation {
    std::string stationName; // 站名

    // 时间表（工作日正向、工作日逆向、周末正向、周末逆向）
    std::vector<std::pair<int, double>> weekdayScheduleForward;
    std::vector<std::pair<int, double>> weekdayScheduleReverse;
    std::vector<std::pair<int, double>> weekendScheduleForward;
    std::vector<std::pair<int, double>> weekendScheduleReverse;


    // 构造函数
    SubwayStation(const std::string& name, std::vector<std::vector<std::pair<int,double>>> timeTable) : stationName(name), weekdayScheduleForward(timeTable[0]), weekdayScheduleReverse(timeTable[1]), weekendScheduleForward(timeTable[2]), weekendScheduleReverse(timeTable[3]) {}
    SubwayStation(const std::string& name) : stationName(name) {}
    SubwayStation(){}
};