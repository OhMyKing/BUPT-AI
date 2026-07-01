#ifndef SUBWAY_LINE_STRUCT_H
#define SUBWAY_LINE_STRUCT_H

#include <iostream>
#include <string>
#include <vector>

#include "SubwayStation.h"
#include "BeijingSubwayLine.h"


// 用于初始化不同地铁线路的信息的结构
struct tempSubwayLineInfo {
    double speed;
    BeijingSubwayLine lineName; // 线路名
    std::vector<int> distance; // 按沿途站点信息正向记录了两个站点间的距离信息
    std::vector<SubwayStation> stations; // 沿途站点信息

    // 发车时间表（工作日正向、工作日逆向、周末正向、周末逆向）
    std::vector<std::pair<int, double>> weekdayScheduleForward;
    std::vector<std::pair<int, double>> weekdayScheduleReverse;
    std::vector<std::pair<int, double>> weekendScheduleForward;
    std::vector<std::pair<int, double>> weekendScheduleReverse;

    // 构造函数
    tempSubwayLineInfo(
        double spd,
        BeijingSubwayLine line,
        std::vector<SubwayStation>& stationInfo,
        const std::vector<int>& distanceInfo,
        const std::vector<std::pair<int, double>>& weekdayForward,
        const std::vector<std::pair<int, double>>& weekdayReverse,
        const std::vector<std::pair<int, double>>& weekendForward,
        const std::vector<std::pair<int, double>>& weekendReverse
    ) : speed(spd),
        lineName(line),
        stations(stationInfo),
        distance(distanceInfo),
        weekdayScheduleForward(weekdayForward),
        weekdayScheduleReverse(weekdayReverse),
        weekendScheduleForward(weekendForward),
        weekendScheduleReverse(weekendReverse) {

        std::pair<int, double> tempTime;

        // 遍历列车的工作日正向发车时间表
        for (int j = 0; j < weekdayScheduleForward.size(); j++) {
            tempTime = { weekdayScheduleForward[j].first, weekdayScheduleForward[j].second };

            for (int k = 0; k < stations.size(); k++) {
                // 向站点的工作日正向发车时刻表增加一个时间temp_time
                //std::cout << "1   " << temp_time[0]<<":"<<temp_time[1] << std::endl;
                stations[k].weekdayScheduleForward.push_back({ tempTime.first, tempTime.second});

                // 如果当前站后边还有站点
                if (k < stations.size() - 1) {
                    // 计算每站的行驶时间和停留时间
                    double distance_between_stations = distance[k];
                    double travel_time = distance_between_stations / speed + 1.0 ;  // 增加路程时间与列车停靠时间
                    tempTime.second += travel_time;
                    //std::cout << "2   " << temp_time[0] << ":" << temp_time[1] << std::endl;
                    if (tempTime.second >= 60.0) {
                        int hoursToAdd = tempTime.second / 60;
                        tempTime.first += hoursToAdd;
                        tempTime.second -= hoursToAdd * 60;
                    }
                    //std::cout << "3  " << temp_time[0] << ":" << temp_time[1] << std::endl;
                    
                }
            }
        }

        // 遍历列车的工作日反向发车时间表
        for (int j = 0; j < weekdayScheduleReverse.size(); j++) {
            tempTime = { weekdayScheduleReverse[j].first, weekdayScheduleReverse[j].second };

            for (int k = 0; k < stations.size(); k++) {
                // 向站点的工作日正向发车时刻表增加一个时间temp_time
                stations[k].weekdayScheduleReverse.push_back({ tempTime.first, tempTime.second });

                // 如果当前站后边还有站点
                if (k < stations.size() - 1) {
                    // 计算每站的行驶时间和停留时间
                    double distance_between_stations = distance[k];
                    double travel_time = distance_between_stations / speed + 1.0;  // 增加路程时间与列车停靠时间
                    tempTime.second += travel_time;
                    if (tempTime.second >= 60.0) {
                        int hoursToAdd = tempTime.second / 60;
                        tempTime.first += hoursToAdd;
                        tempTime.second -= hoursToAdd * 60;
                    }

                }
            }
        }

        // 遍历列车的周末正向发车时间表
        for (int j = 0; j < weekendScheduleForward.size(); j++) {
            tempTime = { weekendScheduleForward[j].first, weekendScheduleForward[j].second };

            for (int k = 0; k < stations.size(); k++) {
                // 向站点的工作日正向发车时刻表增加一个时间temp_time
                stations[k].weekendScheduleForward.push_back({ tempTime.first, tempTime.second });

                // 如果当前站后边还有站点
                if (k < stations.size() - 1) {
                    // 计算每站的行驶时间和停留时间
                    double distance_between_stations = distance[k];
                    double travel_time = distance_between_stations / speed + 1.0;  // 增加路程时间与列车停靠时间
                    tempTime.second += travel_time;
                    if (tempTime.second >= 60.0) {
                        int hoursToAdd = tempTime.second / 60;
                        tempTime.first += hoursToAdd;
                        tempTime.second -= hoursToAdd * 60;
                    }

                }
            }
        }

        // 遍历列车的周末反向发车时间表
        for (int j = 0; j < weekendScheduleReverse.size(); j++) {
            tempTime = { weekendScheduleReverse[j].first, weekendScheduleReverse[j].second };

            for (int k = 0; k < stations.size(); k++) {
                // 向站点的工作日正向发车时刻表增加一个时间temp_time
                stations[k].weekendScheduleReverse.push_back({ tempTime.first, tempTime.second });

                // 如果当前站后边还有站点
                if (k < stations.size() - 1) {
                    // 计算每站的行驶时间和停留时间
                    double distance_between_stations = distance[k];
                    double travel_time = distance_between_stations / speed + 1.0;  // 增加路程时间与列车停靠时间
                    tempTime.second += travel_time;
                    if (tempTime.second >= 60.0) {
                        int hoursToAdd = tempTime.second / 60;
                        tempTime.first += hoursToAdd;
                        tempTime.second -= hoursToAdd * 60;
                    }

                }
            }
        }

    }


};

// 用于存储不同地铁线路的信息的结构
struct SubwayLineInfo {
    BeijingSubwayLine lineName; // 线路名
    std::vector<SubwayStation> stations; // 沿途站点信息

    // 构造函数
    SubwayLineInfo(const tempSubwayLineInfo& tempInfo) : lineName(tempInfo.lineName), stations(tempInfo.stations) {}
    SubwayLineInfo(BeijingSubwayLine _lineName, std::vector<SubwayStation> _stations) :lineName(_lineName), stations(_stations) {}


};

#endif // SUBWAY_LINE_STRUCT_H

