
#include <iostream>
#include <string>
#include <vector>


// 枚举类型表示北京地铁线路
enum BeijingSubwayLine {
    Line1_Batong,        // 1号线/八通线
    Line2,               // 2号线
    Line4,               // 4号线
    Line5,               // 5号线
    Line6,               // 6号线
    Line7,               // 7号线
    Line8,               // 8号线
    Line9,               // 9号线
    Line10,              // 10号线
    Line11,              // 11号线
    Line13,              // 13号线
    Line14,              // 14号线
    Line15,              // 15号线
    Line16,              // 16号线
    Line19,              // 19号线
    DaxingAirport,       // 大兴机场线
    Batong,              // 八通线
    Xijiao,              // 西郊线
    S1,                  // S1线
    Yanfang,             // 燕房线
    Yizhuang,            // 亦庄线
    Changping,           // 昌平线
    Fangshan,            // 房山线
    YizhuangT1,          // 亦庄T1线
    Daxing,              // 大兴线
    CapitalAirport       // 首都机场线
};


// 结构用于存储地铁站点信息
struct SubwayStation {
    std::string stationName; // 站名

    // 时间表（工作日正向、工作日逆向、周末正向、周末逆向）
    std::vector<std::pair<int, double>> weekdayScheduleForward;
    std::vector<std::pair<int, double>> weekdayScheduleReverse;
    std::vector<std::pair<int, double>> weekendScheduleForward;
    std::vector<std::pair<int, double>> weekendScheduleReverse;


    // 构造函数
    SubwayStation(const std::string& name) : stationName(name) {}
};

// 结构用于初始化不同地铁线路的信息
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

        // 遍历列车的工作日正向发车时间表
        for (int j = 0; j < weekdayScheduleForward.size(); j++) {
            std::pair<int, double> tempTime;
            int temp_time[2] = { weekdayScheduleForward[j].first, weekdayScheduleForward[j].second };

            for (int k = 0; k < stations.size(); k++) {
                // 向站点的工作日正向发车时刻表增加一个时间temp_time
                stations[k].weekdayScheduleForward.push_back(std::pair<int, double> {temp_time[0], temp_time[1]});

                // 如果当前站后边还有站点
                if (k < stations.size() - 1) {
                    // 计算每站的行驶时间和停留时间
                    double distance_between_stations = distance[k];
                    double travel_time = distance_between_stations / speed + 1.0 ;  // 增加路程时间与列车停靠时间
                    tempTime.second += travel_time;
                    if (tempTime.second >= 60.0) {
                        int hoursToAdd = tempTime.second / 60;
                        tempTime.first += hoursToAdd;
                        tempTime.second -= hoursToAdd * 60;
                    }
                    
                }
            }
        }

        // 遍历列车的工作日反向发车时间表
        for (int j = 0; j < weekdayScheduleReverse.size(); j++) {
            std::pair<int, double> tempTime;
            int temp_time[2] = { weekdayScheduleReverse[j].first, weekdayScheduleReverse[j].second };

            for (int k = 0; k < stations.size(); k++) {
                // 向站点的工作日正向发车时刻表增加一个时间temp_time
                stations[k].weekdayScheduleReverse.push_back(std::pair<int, double> {temp_time[0], temp_time[1]});

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
            std::pair<int, double> tempTime;
            int temp_time[2] = { weekendScheduleForward[j].first, weekendScheduleForward[j].second };

            for (int k = 0; k < stations.size(); k++) {
                // 向站点的工作日正向发车时刻表增加一个时间temp_time
                stations[k].weekendScheduleForward.push_back(std::pair<int, double> {temp_time[0], temp_time[1]});

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
            std::pair<int, double> tempTime;
            int temp_time[2] = { weekendScheduleReverse[j].first, weekendScheduleReverse[j].second };

            for (int k = 0; k < stations.size(); k++) {
                // 向站点的工作日正向发车时刻表增加一个时间temp_time
                stations[k].weekendScheduleReverse.push_back(std::pair<int, double> {temp_time[0], temp_time[1]});

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

// 结构用于存储不同地铁线路的信息
struct SubwayLineInfo {
    BeijingSubwayLine lineName; // 线路名
    std::vector<SubwayStation> stations; // 沿途站点信息

    // 构造函数
    SubwayLineInfo(const tempSubwayLineInfo& tempInfo) : lineName(tempInfo.lineName), stations(tempInfo.stations) {}

};


int main() {
    // 创建地铁站点信息
    SubwayStation station1("Station A");
    SubwayStation station2("Station B");
    SubwayStation station3("Station C");

    // 创建两个站点之间的距离信息
    std::vector<int> distanceInfo = {10, 15};

    // 创建发车时间表信息
    std::vector<std::pair<int, double>> weekdayForward = {{8, 0.0}, {9, 15.5}};
    std::vector<std::pair<int, double>> weekdayReverse = {{16, 0.0}, {17, 14.5}};

    // 创建tempSubwayLineInfo对象
    tempSubwayLineInfo tempInfo(
        60.0,                  // 速度
        Line1_Batong,          // 线路名
        {station1, station2, station3}, // 站点信息
        distanceInfo,          // 距离信息
        weekdayForward,        // 工作日正向发车时间表
        weekdayReverse,        // 工作日反向发车时间表
        {},                    // 周末正向发车时间表（暂时为空）
        {}                     // 周末反向发车时间表（暂时为空）
    );

    // 创建SubwayLineInfo对象
    SubwayLineInfo lineInfo(tempInfo);

    // 打印tempSubwayLineInfo对象的内容
    std::cout << "tempSubwayLineInfo:" << std::endl;
    std::cout << "Line Name: " << tempInfo.lineName << std::endl;
    std::cout << "Number of Stations: " << tempInfo.stations.size() << std::endl;

    // 打印SubwayLineInfo对象的内容
    std::cout << "\nSubwayLineInfo:" << std::endl;
    std::cout << "Line Name: " << lineInfo.lineName << std::endl;
    std::cout << "Number of Stations: " << lineInfo.stations.size() << std::endl;

    return 0;
}

