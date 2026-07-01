#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <cctype>
#include <cstdlib>

#include "subway_line_struct.h"
#include "SubwayStation.h"
#include "read_data.h"
#include "SubwayGraph.h"

using namespace std;

bool isNumber(const string& str);

int main() {

    // 欢迎界面
    cout << "欢迎使用北京地铁查询系统！" << endl;
    cout << "程序将在1秒后进入选择阶段..." << endl;

    // 延时以增加交互流畅性
    this_thread::sleep_for(chrono::seconds(1));

    // 读取所有数据
    vector<int> speedList = readSpeedData("data/speed_data.txt");
    vector<vector<string>> stationData = readStationData("data/station_data.txt");
    vector<vector<int>> distanceData = readDistanceData("data/station_data.txt");
    vector<vector<vector<pair<int, double>>>> timeData = readTimeData("data/time_data.txt");

    vector<SubwayLineInfo> lines;
    int station_num = 0;

    // 使用数据初始化所有站点和线路
    for (int i = 0; i <= 21; i++) {
        // 创建站点信息
        const vector<string>& stationNames = stationData[i];
        station_num += stationNames.size();

        vector<SubwayStation> line1Stations;
        for (const string& name : stationNames) {
            line1Stations.push_back(SubwayStation(name));
        }


        // 创建一个临时的地铁线路信息（主要是为了从线路发车表初始化每个站点的时刻表）
        tempSubwayLineInfo tempLineInfo(
            speedList[i],                   // 速度
            BeijingSubwayLine(i),           // 线路名
            line1Stations,                  // 站点信息
            distanceData[i],                // 距离信息
            timeData[i][0],                 // 工作日正向发车时间表
            timeData[i][1],                 // 工作日逆向发车时间表
            timeData[i][2],                 // 周末正向发车时间表
            timeData[i][3]                  // 周末逆向发车时间表
        );

        // 创建地铁线路信息
        SubwayLineInfo lineInfo(tempLineInfo);
        lines.push_back(lineInfo);

    }

    //利用所有线路信息建图
    Graph BeijingSubway(lines, 1000, station_num,speedList,distanceData);

    // 为环线增加头尾连接
    BeijingSubway.InsertArc(35,52,1,2.5,1000);
    BeijingSubway.InsertArc(221,265,8,2.5,1000);

    // 下边的交互逻辑直观，为避免冗余信息不予注释
    while (true) {
    label1:system("cls"); // 清屏

        cout << "请选择您想要的操作：" << endl;
        cout << "（查询路线信息前请先查询站点信息，并记住线路起始站与终点站的站点号）" << endl;
        cout << "1. 查询站点信息" << endl;
        cout << "2. 查询路线信息" << endl;
        cout << "3. 修改线路信息" << endl;
        cout << "4. 退出程序" << endl;


        int choice;
        string choiceStr;
        cin >> choiceStr;

        if (isNumber(choiceStr)) {
            choice = stoi(choiceStr);
        }
        else {
            cout << "请输入数字！！！" << endl;
            this_thread::sleep_for(chrono::microseconds(500));
            cin.ignore(numeric_limits<streamsize>::max(), '\n'); 
            goto label1;
        }

        system("cls");

        switch (choice) {
        case 1: {
            cout << "线路编号与线路名的对应关系如下：" << endl;
            cout << "0\t->\t1号线八通线\n1\t->\t2号线\n2\t->\t4号线大兴线\n3\t->\t5号线\n4\t->\t6号线\n5\t->\t7号线\n6\t->\t8号线\n7\t->\t9号线\n8\t->\t10号线\n9\t->\t11号线\n10\t->\t13号线\n11\t->\t14号线\n12\t->\t15号线\n13\t->\t16号线\n14\t->\t大兴机场线\n15\t->\t西郊线\n16\t->\tS1线\n17\t->\t燕房线\n18\t->\t昌平线\n19\t->\t房山线\n20\t->\t亦庄线\n21\t->\t首都机场线" << endl;
        label2:cout << "请输入您想要查询线路的站点序号：" << endl;
            cout << "（查询全部线路请输-1,返回上一界面请输-2）" << endl;
            int station;
            while (true) {
                cout << "请输入线路编号：";
                if (cin >> station) {
                    if (station < 23 && station > -3) {
                        if (station == -2) goto label1;
                        if (station == -1) {
                            BeijingSubway.Show();
                        }
                        else {
                            BeijingSubway.Show(station);
                        }
                        goto label2;
                    }
                    else {
                        cout << "暂时没有这条线路，请重新输入：" << endl;
                    }
                }
                else {
                    cout << "请输入数字！！！" << endl;
                    cin.clear();
                    cin.ignore(100, '\n');
                }
            }
        }
        case 2: {
            int start , end;
            system("cls");
    label3:cout << "请输入起始站点名称：\n（重新输入请按-1，返回上一界面请输-2）" << endl;
            string startStr;
            cin >> startStr;

            if (isNumber(startStr)) {
                start = stoi(startStr);
                if (start == -1) goto label3;
                if (start == -2) goto label1;
                if (start != -1 && start != -2)goto label3;
            }
            else {
                vector<int> numTable = BeijingSubway.FindVertexIndex(startStr, BeijingSubway.vexNum);
                if (numTable.size() != 0) {
                    start = BeijingSubway.FindVertexIndex(startStr, BeijingSubway.vexNum)[0];
                }
                else {
                    cout << "请输入正确的站点名！！！" << endl;
                    goto label3;
                }
            }

            cout << "请输入终点站点名称：\n（重新输入请按-1，返回上一界面请输-2）" << endl;
            string endStr;
            cin >> endStr;

            if (isNumber(endStr)) {
                end = stoi(endStr);
                if (end == -1) goto label3;
                if (end == -2) goto label1;
                if (end != -1 && end != -2)goto label3;
            }
            else {
                vector<int> numTable = BeijingSubway.FindVertexIndex(endStr, BeijingSubway.vexNum);
                if (numTable.size() != 0) {
                    end = BeijingSubway.FindVertexIndex(endStr, BeijingSubway.vexNum)[0];
                }
                else {
                    cout << "请输入正确的站点名！！！" << endl;
                    goto label3;
                }
            }

        label4:system("cls");
            cout << "请选择查询策略：\n" << endl;
            cout << "1. 最短路径（最少花销）" << endl;
            cout << "2. 最少换乘" << endl;
            cout << "3. 最快到达" << endl;
            cout << "4. 重新选择站点信息" << endl;

            int strategy = 0;
            string strategyStr;
            cin >> strategyStr;

            if (isNumber(strategyStr)) {
                strategy = stoi(strategyStr);
            }
            else {
                cout << "请输入数字！！！" << endl;
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
                this_thread::sleep_for(chrono::microseconds(500));
                goto label4;
            }

            system("cls");

            if (strategy == 4)goto label3;

            switch (strategy) {
            case 1:
                BeijingSubway.shortestPath(start, end);
                cout << "按任意键继续..." << endl;
                cin.get();
                cin.get();
                goto label3;
            case 2:
                BeijingSubway.minTransferPath(start, end);
                cout << "按任意键继续..." << endl;
                cin.get();
                cin.get();
                goto label3;
            case 3:
                BeijingSubway.fastestPath(start, end);
                cout << "按任意键继续..." << endl;
                cin.get();
                cin.get();
                goto label3;
            default:
                cout << "无效的策略选择，请重新选择" << endl;
                cout << "按任意键继续..." << endl;
                cin.get();
                cin.get();
                goto label3;
            }
            goto label1;
        }
        case 3: {
            int strategy;
            system("cls");
        label6:cout << "增加站点请输1，删除站点请输2：\n（重新输入请按-1，返回上一界面请输-2）" << endl;
            string strategyStr;
            cin >> strategyStr;

            if (isNumber(strategyStr)) {
                strategy = stoi(strategyStr);
                if (strategy == -1) goto label6;
                if (strategy == -2) goto label1;
                if (strategy > 2 || strategy < -3) {
                    cout << "请输入正确的数字！！！" << endl;
                    cin.ignore(numeric_limits<streamsize>::max(), '\n');
                    this_thread::sleep_for(chrono::microseconds(1000));
                    goto label6;
                }
            }
            else {
                cout << "请输入数字！！！" << endl;
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
                this_thread::sleep_for(chrono::microseconds(500));
                goto label6;
            }
          
            switch (strategy) {
            case 1: {
                while (true) {
                    label7:string name;
                    cout << "请输入您想增加的站点名：\n（重新输入请按-1，返回上一界面请输-2）" << endl;
                    cin >> name;
                    if (isNumber(name)) {
                        int flag = stoi(name);
                        if (flag == -1)goto label7;
                        if (flag == -2)goto label6;
                        if (flag > 0 || flag < -3) {
                            goto label7;
                        }
                    }

                label8:cout << "请输入站点时刻表文件的名称：\n（重新输入请按-1，返回上一界面请输-2，使用默认初始时刻表请输-3）\n" << endl;
                    string path;
                    cin >> path;
                    if (isNumber(path)) {
                        int flag = stoi(path);
                        if (flag == -1)goto label8;
                        if (flag == -2)goto label7;
                        if(flag == -3){

                            vector<vector<vector<pair<int, double>>>> timeTable = readTimeData("data/time_data.txt");
                            try {
                                if (timeTable.size() == 0) {
                                    cout << "文件路径错误或文件格式错误，请检查！！！" << endl;
                                    goto label8;
                                }
                                else {
                                    SubwayStation station(name, timeTable[0]);
                                    BeijingSubway.addNode(station);
                                }
                            }
                            catch (const std::bad_alloc& e) {
                                cout << "文件路径错误或文件格式错误，请检查！！！" << endl; goto label8;
                            }

                        }
                        if (flag > 0 || flag < -3) {
                            cout << "请输入数字！！！" << endl;
                            goto label8;
                        }
                    }
                    else {
                        vector<vector<vector<pair<int, double>>>> timeTable = readTimeData(path);
                        try {
                            if (timeTable.size() == 0) {
                                cout << "文件路径错误或文件格式错误，请检查！！！" << endl;
                                goto label8;
                            }
                            else {
                                SubwayStation station(name, timeTable[0]);
                                BeijingSubway.addNode(station);
                            }
                        }
                        catch (const std::bad_alloc& e) { cout << "文件路径错误或文件格式错误，请检查！！！" << endl; goto label8;
                        }
                    }
                    
                    cout << "已完成节点的增加。" << endl;
                }
            }
            case 2: {
            label9:system("cls");
                while (true) {
                    int index = 0;
                    cout << "请输入您想删除的站点名称：\n（重新输入请按-1，返回上一界面请输-2）\n" << endl;
                    string indexStr;
                    cin >> indexStr;

                    if (isNumber(indexStr)) {
                        index = stoi(indexStr);
                        if (index == -1) goto label9;
                        if (index == -2) goto label6;
                        if (index != -1 && index != -2)goto label9;
                    }
                    else {
                        vector<int> numTable = BeijingSubway.FindVertexIndex(indexStr, BeijingSubway.vexNum);
                        if (numTable.size() != 0) {
                            index = BeijingSubway.FindVertexIndex(indexStr, BeijingSubway.vexNum)[0];
                        }
                        else {
                            cout << "请输入正确的站点名！！！" << endl;
                            goto label9;
                        }
                    }
                    BeijingSubway.removeNode(index);
                    cout << "已完成节点的删除。" << endl;
                }
            }
            }

        }
        case 4: {
            cout << "感谢使用北京地铁查询系统，再见！" << endl;
            return 0;
        }
        default:
            cout << "无效的操作，请重新选择" << endl;
        }

        cout << "按任意键继续..." << endl;
        cin.get();
        cin.get(); 
    }


    return 0;
}

//判断一个字符串是否是数字
bool isNumber(const string& str) {
    if (str.empty()) {
        return false;  // 字符串为空不是数字
    }

    size_t start = 0;

    // 如果字符串的第一个字符是负号 '-'，则从第二个字符开始检查
    if (str[0] == '-') {
        start = 1;

        // 如果字符串只包含一个负号，视为不是数字
        if (str.size() == 1) {
            return false;
        }
    }

    for (size_t i = start; i < str.size(); i++) {
        // 调用函数确定字符串是否是数字
        if (!isdigit(str[i])) {
            return false;
        }
    }

    return true;
}
