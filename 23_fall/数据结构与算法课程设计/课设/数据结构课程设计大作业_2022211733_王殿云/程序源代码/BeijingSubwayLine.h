#pragma once

// 枚举类型表示北京地铁线路
enum BeijingSubwayLine {
    Line1_Batong,        // 1号线八通线
    Line2,               // 2号线
    Line4_Daxing,        // 4号线大兴线
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
    DaxingAirport,       // 大兴机场线
    Xijiao,              // 西郊线
    S1,                  // S1线
    Yanfang,             // 燕房线
    Changping,           // 昌平线
    Fangshan,            // 房山线
    Yizhuang,            // 亦庄线
    CapitalAirport       // 首都机场线
};

// 把北京地铁线路转成字符形式
std::string subwayLineToString(int line) {
    switch (line) {
    case Line1_Batong:
        return "1号线八通线";
    case Line2:
        return "2号线";
    case Line4_Daxing:
        return "4号线大兴线";
    case Line5:
        return "5号线";
    case Line6:
        return "6号线";
    case Line7:
        return "7号线";
    case Line8:
        return "8号线";
    case Line9:
        return "9号线";
    case Line10:
        return "10号线";
    case Line11:
        return "11号线";
    case Line13:
        return "13号线";
    case Line14:
        return "14号线";
    case Line15:
        return "15号线";
    case Line16:
        return "16号线";
    case DaxingAirport:
        return "大兴机场线";
    case Xijiao:
        return "西郊线";
    case S1:
        return "S1线";
    case Yanfang:
        return "燕房线";
    case Changping:
        return "昌平线";
    case Fangshan:
        return "房山线";
    case Yizhuang:
        return "亦庄线";
    case CapitalAirport:
        return "首都机场线";
    case -1:
        return "换乘";
    default:
        return "未知线路"; // 处理未知枚举值
    }
}