#pragma once


#include <iostream>
#include <vector>
#include <utility>
#include <ctime>
#include <limits> 

using namespace std;

// 定义时间表的类型
using TimeTable = vector<pair<int, double>>;

// 获取当前系统时间并返回其分钟表示
double getCurrentTimeInMinutes() {
    time_t now;
    struct tm timeinfo;
    time(&now);

    // 获取本地时间
    localtime_s(&timeinfo, &now);

    int current_hour = timeinfo.tm_hour;
    int current_minute = timeinfo.tm_min;
    int current_secound = timeinfo.tm_sec;

    // 将时间统一成分钟表示
    return current_hour * 60.0 + current_minute + current_secound / 60.0;
}

// 找到当前时间之后最近的时间并返回其序号
int findNearestTime(const TimeTable& timeTable) {
    double current_time = getCurrentTimeInMinutes();
    int closest_index = -1;
    double closest_time_diff = numeric_limits<double>::max();

    // 遍历时间表直到找到当前时间之后的一个时间
    for (int i = 0; i < timeTable.size(); ++i) {
        double time = timeTable[i].first * 60.0 + timeTable[i].second;
        double time_diff = time - current_time;

        if (time_diff >= 0 && time_diff < closest_time_diff) {
            closest_time_diff = time_diff;
            closest_index = i;
        }
    }

    return closest_index;
}

// 找到某个时间之后最近的时间并返回其序号
int findNearestTime(const TimeTable& timeTable, double current_time) {
    int closest_index = -1;
    double closest_time_diff = numeric_limits<double>::max();

    // 遍历时间表直到找到当前时间之后的一个时间
    for (int i = 0; i < timeTable.size(); ++i) {
        double time = timeTable[i].first * 60.0 + timeTable[i].second;
        double time_diff = time - current_time;

        if (time_diff >= 0 && time_diff < closest_time_diff) {
            closest_time_diff = time_diff;
            closest_index = i;
        }
    }

    return closest_index;
}


// 计算当前时间之后最近的时间距离当前时间有多少分钟
double calculateTimeDifference(int nearest_index, TimeTable timeTable) {
    if (nearest_index != -1) {
        double current_time = getCurrentTimeInMinutes();
        double nearest_time = timeTable[nearest_index].first * 60.0 + timeTable[nearest_index].second;
        double time_diff = nearest_time - current_time;
        return time_diff;
    }
    else {
        // 如果未找到当前时间之后的时间，返回负数错误
        return -1.0;
    }
}

// 计算当前时间之后最近的时间距离当前时间有多少分钟
double calculateTimeDifference(double current_time,int nearest_index, TimeTable timeTable) {
    if (nearest_index != -1) {
        double nearest_time = timeTable[nearest_index].first * 60.0 + timeTable[nearest_index].second;
        double time_diff = nearest_time - current_time;
        return time_diff;
    }
    else {
        // 如果未找到当前时间之后的时间，返回负数表示错误
        return -1.0;
    }
}

// 返回当前是星期几
int getCurrentDayOfWeek() {
    time_t now;
    struct tm timeinfo;
    time(&now);

    // 使用 localtime_s 来获取本地时间
    localtime_s(&timeinfo, &now);

    return timeinfo.tm_wday;
}