#pragma once

#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <regex>
#include <unordered_set>

#include "SubwayStation.h"

// 读取线路速度并按序返回
std::vector<int> readSpeedData(const std::string& filename) {
    std::vector<int> speedList;
    std::ifstream file(filename);

    // 无法正常打开文件返回空表
    if (!file.is_open()) {
        std::cerr << "无法打开文件：" << filename << std::endl;
        return speedList;
    }

    std::string line;
    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '#') {
            continue;  // 跳过空行和注释行
        }

        try {
            int speed = std::stoi(line);
            speedList.push_back(speed);
        }
        catch (const std::exception& e) {
            // 如果无法解析为整数，忽略该行
            continue;
        }
    }

    file.close();
    return speedList;
}

// 读取站点名称并按序返回
std::vector<std::vector<std::string>> readStationData(const std::string& filename) {
    std::vector<std::vector<std::string>> stationData;
    std::unordered_set<std::string> seenStations; // 用于记录已经出现的站点

    // 无法正常打开文件返回空表
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "无法打开文件： " << filename << std::endl;
        return stationData;
    }

    std::vector<std::string> currentLine;
    std::string line;

    while (std::getline(file, line)) {
        // 发现新的线路信息
        if (line.empty() || line[0] == '#') {
            if (!currentLine.empty()) {
                stationData.push_back(currentLine);
                currentLine.clear();
                seenStations.clear(); // 清空已经出现的站点，以便处理下一个线路
            }
        }
        else {
            std::istringstream lineStream(line);
            std::string station1, station2;
            lineStream >> station1 >> station2;

            // 检查是否已经出现过这一站点，如果没有出现就存下来
            if (seenStations.find(station1) == seenStations.end()) {
                currentLine.push_back(station1);
                seenStations.insert(station1);
            }

            if (seenStations.find(station2) == seenStations.end()) {
                currentLine.push_back(station2);
                seenStations.insert(station2);
            }
        }
    }

    // 处理最后一个线路
    if (!currentLine.empty()) {
        stationData.push_back(currentLine);
    }

    file.close();

    return stationData;
}


// 读取距离信息并按序返回
std::vector<std::vector<int>> readDistanceData(const std::string& filename) {
    std::vector<std::vector<int>> distanceData;
    std::ifstream file(filename);

    if (!file.is_open()) {
        std::cerr << "无法打开文件：" << filename << std::endl;
        return distanceData;
    }

    std::vector<int> currentLineDistances;
    std::string line;
    while (std::getline(file, line)) {
        if (line.empty()) {
            continue;  // 跳过空行
        }

        if (line[0] == '#') {
            // 发现新的线路，清空当前线路的距离信息
            if (!currentLineDistances.empty()) {
                distanceData.push_back(currentLineDistances);
                currentLineDistances.clear();
            }
        }
        else {
            // 解析站点信息和距离
            std::istringstream iss(line);
            std::string stationName1, stationName2;
            int distance;
            iss >> stationName1 >> stationName2 >> distance;
            currentLineDistances.push_back(distance);
        }
    }

    // 添加最后一个线路的距离信息
    if (!currentLineDistances.empty()) {
        distanceData.push_back(currentLineDistances);
    }

    file.close();
    return distanceData;
}

// 读取时间表并以指定格式返回
std::vector<std::vector<std::vector<std::pair<int, double>>>> readTimeData(std::string filename) {
    std::vector<std::vector<std::vector<std::pair<int, double>>>> timeData;

        std::ifstream file(filename);
        // 无法打开文件返回空表
        if (!file.is_open()) {
            std::cerr << "无法打开文件：" << filename << std::endl;
            return timeData;
        }
        if (file.bad()) {
            return timeData; 
        }

        std::string line;
        while (getline(file, line)) {
            // 发现新线路
            if (line[0] == '#') {
                timeData.push_back(std::vector<std::vector<std::pair<int, double>>>());
            }
            // 发现新表
            else if (line[0] == '[') {
                timeData.back().push_back(std::vector<std::pair<int, double>>());
            }
            else {
                std::stringstream ss(line);
                int hour;
                // 时间数据每行第一个是小时，后边的是分钟
                // 读取每行第一个作为该行的小时数并依次与后边的分钟组合作为该小时的时间数据存下
                ss >> hour;
                timeData.back().back().push_back(std::pair<int, double>(hour, 0));
                for (double minute; ss >> minute;) {
                    timeData.back().back().back().second = minute;
                    timeData.back().back().push_back(std::pair<int, double>(hour, 0));
                }
            }
        }
    


    return timeData;
}


