#include <iostream>
#include <vector>
#include <utility>
#include <ctime>
#include <ctime>
#include <limits>

using namespace std;

// 定义时间表的类型
using TimeTable = vector<pair<int, double>>;

// 获取当前系统时间并返回其分钟表示
double getCurrentTimeInMinutes() {
    time_t now;
    struct tm* timeinfo;
    time(&now);
    timeinfo = localtime(&now);

    int current_hour = timeinfo->tm_hour;
    int current_minute = timeinfo->tm_min;

    return current_hour * 60.0 + current_minute;
}

// 找到当前时间之后最近的时间并返回其序号
int findNearestTime(const TimeTable& timeTable) {
    double current_time = getCurrentTimeInMinutes();
    int closest_index = -1;
    double closest_time_diff = numeric_limits<double>::max();

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

int main() {
    // 示例时间表
    TimeTable timeTable = {
        {8, 0},
        {9, 30},
        {12, 15},
        {14, 11},
        {14, 45}
    };

    int nearest_index = findNearestTime(timeTable);

    if (nearest_index != -1) {
        cout << "最近的时间在序号 " << nearest_index << "，时间为 " << timeTable[nearest_index].first << ":" << timeTable[nearest_index].second << endl;
    } else {
        cout << "未找到当前时间之后的时间" << endl;
    }

    return 0;
}
