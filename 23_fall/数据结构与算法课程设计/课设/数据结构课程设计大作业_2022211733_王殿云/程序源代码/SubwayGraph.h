#ifndef SUBWAYGRAPH_H
#define SUBWAYGRAPH_H

#include <iostream>
#include <string>
#include <vector>
#include <queue>

#include "BeijingSubwayLine.h"
#include "subway_line_struct.h"
#include "node.h"
#include "time.h"

using namespace std;

// 地铁收费表
int subway_fare(double distance) {
    if (distance <= 0.0) {
        return 0;
    }
    else if (distance <= 6000.0) {
        return 3;
    }
    else if (distance <= 12000.0) {
        return 4;
    }
    else if (distance <= 22000.0) {
        return 5;
    }
    else if (distance <= 32000.0) {
        return 6;
    }
    else {
        // 对于32公里以上的情况，每加1元可乘20公里
        double extra_distance = distance - 32000.0;
        int extra_fare = 6;  // 初始费用
        while (extra_distance > 0.0) {
            extra_fare += 1;
            extra_distance -= 20000.0;
        }
        return extra_fare;
    }
}


// 保存当天的星期信息
int curr_day = getCurrentDayOfWeek();

enum VisitStatus { VISITED, UNVISITED,DELETED};
class Graph
{
public:
    int vexNum;										                                                                                    // 点的数量
    Graph(const vector<SubwayLineInfo>& lines, int _vexMaxNum, int _vexNum, vector<int> speedList, vector<vector<int>> distanceData);	// 构造函数
    ~Graph();										                                                                                    // 析构函数
    void InsertArc(int vex1, int vex2, int line, double time, int dis);                                                                 // 插入边
    void Show();									                                                                                    // 打印所有站点信息
    void Show(int line);									                                                                            // 打印线路的所有站点信息
    void fastestPath(int start, int end);                                                                                               // 打印两站之间用时最少的线路    
    void shortestPath(int start, int end);                                                                                              // 打印两站之间距离最短的线路    
    void minTransferPath(int start, int end);                                                                                           // 打印两站之间换乘最少的线路
    void removeNode(int n);                                                                                                             // 删除节点
    void addNode(SubwayStation station);                                                                                                // 增加节点
    vector<int> FindVertexIndex(const string& stationName, int curr_num);                                                               // 寻找同名站点


private:
    VisitStatus* tag;                                                                                                                   // 访问状态表
    VexNode* vexTable;								                                                                                    // 节点表  
    int vexMaxNum;									                                                                                    // 储存点的最大值
    int arcNum;										                                                                                    // 边的数量
    vector<pair<int, double>> getTimetable(int index, int drct);                                                                        // 获取指定站点某个方向的时间表
    ArcNode* GetEdge(int vex1, int vex2);                                                                                               // 获取指定两个站点间的边节点
    void printPath(int start, int end, vector<int> shortestPath);                                                                       // 打印路径
};

// 构造函数
Graph::Graph(const vector<SubwayLineInfo>& lines, int _vexMaxNum, int _vexNum, vector<int> speedList, vector<vector<int>> distanceData) {
    vexMaxNum = _vexMaxNum;  // 顶点的最大数量
    vexNum = _vexNum;  // 实际顶点数量
    arcNum = 0;  // 弧的数量初始为0
    vexTable = new VexNode[vexMaxNum];  // 分配存储顶点信息的数组
    tag = new VisitStatus[vexMaxNum];  // 分配存储顶点访问状态的数组

    for (int i = 0; i < vexNum; i++) {
        tag[i] = UNVISITED;  // 初始化顶点的访问状态为未访问
    }

    int curr_num = 0;
    for (const SubwayLineInfo& line : lines) {
        vector<SubwayStation>stations = line.stations;
        int curr_line_num = 0;

        for (const SubwayStation& station : stations) {
            vexTable[curr_num] = VexNode(station);
            curr_num++;
            curr_line_num++;

            //为线路中的站点添加与前后站之间的边节点信息
            if (curr_line_num > 1) {
                double time = float(distanceData[line.lineName][curr_line_num-2]) / speedList[line.lineName];
                InsertArc(curr_num - 1, curr_num - 2, line.lineName, time, distanceData[line.lineName][curr_line_num-2]);  
            }
            //处理同名站点互相换乘的问题
            vector<int> flags = FindVertexIndex(station.stationName, curr_num); 
            if (flags.size() != 0) {
                for (int flag : flags) {
                    InsertArc(curr_num - 1, flag, -1, 5.0,0);
                }
            }
        }
    }
}

// 析构函数
Graph::~Graph() {
    if (vexTable != NULL) {
        for (int i = 0; i < vexNum; ++i)
            delete vexTable[i].firstArc;  // 删除顶点的邻接表
        delete[] vexTable;  // 释放顶点信息数组的内存
    }
}

//添加节点
void Graph::addNode(SubwayStation station) {
    if (vexNum < vexMaxNum) {   // 检查邻接表的内存数
        vexTable[vexNum] = VexNode(station);
        tag[vexNum] = UNVISITED;    // 设置访问表信息
        vexNum++; 
        vector<int> flags = FindVertexIndex(station.stationName, vexNum); //处理同名站点互相换乘的问题
        if (flags.size() != 0) {
            for (int flag : flags) {
                InsertArc(vexNum - 1, flag, -1, 5.0, 0);
            }
        }
    }
    else {
        cout << "系统内存已满，无法添加新的站点，请联系管理员！！！" << endl;
    }
}

// 删除指定节点与其相关的边节点信息
void Graph::removeNode(int n) {
    
    //检查节点编号合理性
    if (n < 0 || n >= vexNum) {
        cout << "错误的节点编号！！！" << endl;
        return;
    }

    // 删除与该节点相关的所有边
    ArcNode* currentArc = vexTable[n].firstArc;
    while (currentArc != nullptr) {
        int neighborIndex = currentArc->adjVex;
        ArcNode* nextArc = currentArc->nextArc;

        // 删除邻接表中的边
        delete currentArc;

        // 更新边的数量
        arcNum--;

        // 删除对称的边
        if (vexTable[neighborIndex].firstArc != nullptr) {
            ArcNode* prevArc = nullptr;
            currentArc = vexTable[neighborIndex].firstArc;

            while (currentArc != nullptr && currentArc->adjVex != n) {
                prevArc = currentArc;
                currentArc = currentArc->nextArc;
            }

            if (currentArc != nullptr) {
                if (prevArc != nullptr) {
                    prevArc->nextArc = currentArc->nextArc;
                }
                else {
                    vexTable[neighborIndex].firstArc = currentArc->nextArc;
                }

                delete currentArc;
            }
        }

        currentArc = nextArc;
    }

    // 删除节点及其相关信息
    vexNum--;

    // 移动后续节点信息，并更新邻接表中的节点索引
    for (int i = n; i < vexNum; i++) {
        vexTable[i] = vexTable[i + 1];

        // 更新邻接表中的节点索引
        ArcNode* arc = vexTable[i].firstArc;
        while (arc != nullptr) {
            if (arc->adjVex > n) {
                arc->adjVex--;
            }
            arc = arc->nextArc;
        }
    }

    // 清空被删除节点的信息
    vexTable[vexNum].firstArc = nullptr;

}

// 插入边
void Graph::InsertArc(int vex1, int vex2,int line,double time,int dist) {
    if (line == -1) {
        vexTable[vex1].firstArc = new ArcNode(vex2,0, 5.0, line,  0, vexTable[vex1].firstArc);  // 在 vex1 的邻接表中插入 vex2
        vexTable[vex2].firstArc = new ArcNode(vex1,0, 5.0, line,0, vexTable[vex2].firstArc);  // 在 vex2 的邻接表中插入 vex1
    }
    else {
        vexTable[vex1].firstArc = new ArcNode(vex2,dist, time, line,  -1, vexTable[vex1].firstArc);  // 在 vex1 的邻接表中插入 vex2
        vexTable[vex2].firstArc = new ArcNode(vex1,dist, time, line,  1, vexTable[vex2].firstArc);  // 在 vex2 的邻接表中插入 vex1
    }
    arcNum++;  // 弧的数量增加
}

// 获取两个节点间的边
ArcNode* Graph::GetEdge(int vex1, int vex2) {
    // 检查 vex1 和 vex2 是否是有效的顶点索引
    if (vex1 < 0 || vex1 >= vexNum || vex2 < 0 || vex2 >= vexNum) {
        return nullptr; // 无效的顶点
    }

    // 遍历 vex1 的邻接表以查找到达 vex2 的边
    ArcNode* p = vexTable[vex1].firstArc;
    while (p != nullptr) {
        if (p->adjVex == vex2) {
            return p; // 找到到达 vex2 的边
        }
        p = p->nextArc; // 移动到下一个相邻顶点
    }

    // 如果循环完成而没有找到边，则 vex1 和 vex2 不直接相连
    return nullptr;
}

// 展示每个节点与其相邻的节点信息
void Graph::Show() {
    for (int i = 0; i < vexNum; i++) {
        cout << "站点名称：" << vexTable[i].station.stationName << endl;
        cout << "站点序号:" << i <<endl;
        cout << "相邻站点：" << endl;

        ArcNode* p = vexTable[i].firstArc; 
        while (p != NULL) {
            cout << "  - " << vexTable[p->adjVex].station.stationName;
            cout << " 线路号：" << subwayLineToString(p->line)  << endl;
            cout << " 方向：" << p->drct  << endl;
            cout << " 时间：" << p->time  << endl;
            cout << " 距离：" << p->dist << endl;
            p = p->nextArc;  // 移动到下一个相邻节点
        }
        cout << endl;
    }
}

// 展示某条线路的节点信息
void Graph::Show(int line) {
    for (int i = 0; i < vexNum; i++) {
        ArcNode* p = vexTable[i].firstArc;
        while (p != NULL) {
            if (p->line == line) {
                cout << "站点名称：" << vexTable[i].station.stationName << endl;
                cout << "站点序号:" << i << endl;
                cout << "相邻站点：" << endl;
                cout << "  - " << vexTable[p->adjVex].station.stationName;
                cout << " 线路号：" << subwayLineToString(p->line) << endl;
                cout << " 方向：" << p->drct << endl;
                cout << " 时间：" << p->time << endl;
                cout << " 距离：" << p->dist << endl;
                cout << endl;
            }
            p = p->nextArc;  // 移动到下一个相邻节点
        }
    }
}

// 寻找相同站名的站点并返回全部索引
vector<int> Graph::FindVertexIndex(const string& stationName, int curr_num) {
    vector<int> index;
    for (int i = 0; i < curr_num - 1; i++) {
        if (vexTable[i].station.stationName == stationName) {
            // 找到了具有相同站点名称的顶点，记录其索引
            index.push_back(i);
        }
    }
    return index; // 没有找到具有相同站点名称的顶点
}

// 打印路径
void Graph::printPath(int start, int end, vector<int> shortestPath) {
    double time = 0.0;
    int dis = 0;
    int trans = 0;
    int cost = 0;

    // 打印路径
    cout << "第 " << 1 << " 站：\t" << vexTable[start].station.stationName;
    ArcNode* p = GetEdge(shortestPath[0], shortestPath[1]);
    cout << "\n经过线路：" << subwayLineToString(p->line) << endl;
    // 计算等车时间
    if (p->drct != 0) {
        //如果第一个动作不是换乘，则按等车处理
        vector<pair<int, double>> timeTable = getTimetable(shortestPath[0], p->drct);
        time += calculateTimeDifference(findNearestTime(timeTable), timeTable);
    }
    else {
        ArcNode* p1 = GetEdge(shortestPath[1], shortestPath[2]);
        vector<pair<int, double>> timeTable = getTimetable(shortestPath[0], p->drct);
        time += calculateTimeDifference(findNearestTime(timeTable), timeTable);
    }
    dis += p->dist;    // 路程距离
    time += p->time;    // 路上时间
    for (int i = 1; i < shortestPath.size(); ++i) {
        int vertexIndex = shortestPath[i];
        int pre_vertexIndex = shortestPath[i - 1];
        string station_name = vexTable[vertexIndex].station.stationName;
        cout << "第 " << i + 1 << " 站：\t" << station_name;

        if (i < shortestPath.size() - 1) {
            ArcNode* p = GetEdge(vertexIndex, pre_vertexIndex);
            cout << "\n经过线路：" << subwayLineToString(p->line) << endl;

            if (p->line == -1) {
                trans++;
                time += 5.0;
            }
            else {
                dis += p->dist;    // 路程距离
                time += p->time;    // 路上时间
                time += 1.0;        // 停靠时间
            }
        }
    }

    cout << "到达终点！" << endl;


    cout << "换乘次数为：" << trans << " 次" << endl;
    cout << "路程时间为：" << time << " 分" << endl;
    cout << "路程距离为：" << dis << " 米" << endl;
    cout << "花费为：" << subway_fare(dis) << " 元" << endl;
}

// 把时间作为边权重，使用带权图的Dijkstra算法求得最快路径
void Graph::fastestPath(int start, int end) {
    vector<double> dist(vexNum, numeric_limits<double>::max());  // 保存起始点到各点的最短距离
    vector<int> prev(vexNum, -1);  // 保存最短路径的前一个节点
    vector<bool> visited(vexNum, false);  // 标记节点是否已被访问

    dist[start] = 0;  // 起始点到自身的距离为0

    for (int count = 0; count < vexNum - 1; ++count) {
        int u = -1;
        // 选择未访问的节点中距离最短的节点
        for (int i = 0; i < vexNum; ++i) {
            if (!visited[i] && (u == -1 || dist[i] < dist[u])) {
                u = i;
            }
        }

        if (dist[u] == numeric_limits<double>::max()) {
            break;  // 如果没有可达的节点了，退出循环
        }

        visited[u] = true;  // 标记节点为已访问

        // 更新从起始点到各节点的距离
        ArcNode* p = vexTable[u].firstArc;
        while (p != NULL) {
            int v = p->adjVex;
            double weight = p->time; // 边权重设置为时间
            if (!visited[v] && (dist[u] + weight) < dist[v]) {
                dist[v] = dist[u] + weight;
                prev[v] = u;
            }
            p = p->nextArc;
        }
    }

    // 构建最短路径
    vector<int> shortestPath;
    vector<int> drcts;  // 保存路径上的drct值

    int current = end;
    while (current != -1) {
        shortestPath.push_back(current);
        if (vexTable[current].station.stationName == vexTable[start].station.stationName) {
            break;  // 到达起始点，退出循环
        }

        int prevNode = prev[current];
        ArcNode* p = vexTable[prevNode].firstArc;
        while (p != NULL) {
            if (p->adjVex == current) {
                drcts.push_back(p->drct);
                break;
            }
            p = p->nextArc;
        }

        current = prevNode;
    }

    // 将路径反转，得到从起点到终点的顺序
    reverse(shortestPath.begin(), shortestPath.end());
    reverse(drcts.begin(), drcts.end());

    // 添加-2表示到达终点
    drcts.push_back(-2);

    double wait_time = 0.0;
    double trans_time = 0.0;


    // 计算换乘时间与等车时间
    if (drcts[0] != 0) { 
        //如果第一个动作不是换乘，则按等车处理
        vector<pair<int, double>> timeTable = getTimetable(shortestPath[0], drcts[0]);
        wait_time = calculateTimeDifference(findNearestTime(timeTable), timeTable);

    }
    for (int i = 0; i < drcts.size(); i++) {
        if (drcts[i] == 0) {
            trans_time += 5;    // 等车时长
        }
        else {
            dist[end] += 1;     // 列车停靠时长
        }
    }

    // 打印路径
    cout << "从“" << vexTable[start].station.stationName << "”到“" << vexTable[end].station.stationName << " 时间最短的路径是：" << endl;
    printPath(start, end, shortestPath);
}

// 把换乘数作为边权重，使用带权图的Dijkstra算法求得换乘最少的路径
void Graph::minTransferPath(int start, int end) {
    vector<double> dist(vexNum, numeric_limits<double>::max());  // 保存起始点到各点的最短距离
    vector<int> prev(vexNum, -1);  // 保存最短路径的前一个节点
    vector<bool> visited(vexNum, false);  // 标记节点是否已被访问
    

    dist[start] = 0;  // 起始点到自身的距离为0

    for (int count = 0; count < vexNum - 1; ++count) {
        int u = -1;
        // 选择未访问的节点中距离最短的节点
        for (int i = 0; i < vexNum; ++i) {
            if (!visited[i] && (u == -1 || dist[i] < dist[u])) {
                u = i;
            }
        }

        if (dist[u] == numeric_limits<double>::max()) {
            break;  // 如果没有可达的节点了，退出循环
        }

        visited[u] = true;  // 标记节点为已访问

        // 更新从起始点到各节点的距离
        ArcNode* p = vexTable[u].firstArc;
        while (p != NULL) {
            int v = p->adjVex;
            double weight = (p->drct == 0 ? 1 : 100);   //换乘的权重设为大数
            if (!visited[v] && (dist[u] + weight) < dist[v]) {
                dist[v] = dist[u] + weight;
                prev[v] = u;
            }
            p = p->nextArc;
        }
    }

    // 构建最短路径
    vector<int> shortestPath;

    int current = end;
    while (current != -1) {
        shortestPath.push_back(current);
        if (vexTable[current].station.stationName == vexTable[start].station.stationName) {
            break;  // 到达起始点，退出循环
        }

        int prevNode = prev[current];
        ArcNode* p = vexTable[prevNode].firstArc;
        while (p != NULL) {
            if (p->adjVex == current) {
                break;
            }
            p = p->nextArc;
        }

        current = prevNode;
    }

    // 将路径反转，得到从起点到终点的顺序
    reverse(shortestPath.begin(), shortestPath.end());


    // 打印路径
    cout << "从“" << vexTable[start].station.stationName << "”到“" << vexTable[end].station.stationName << "”换乘次数最少的路径是：" << endl;
    printPath(start, end, shortestPath);
}

// 把距离作为边权重，使用带权图的Dijkstra算法求得距离最短且花费最少的路径
void Graph::shortestPath(int start, int end) {
    vector<double> dist(vexNum, numeric_limits<double>::max());  // 保存起始点到各点的最短距离
    vector<int> prev(vexNum, -1);  // 保存最短路径的前一个节点
    vector<bool> visited(vexNum, false);  // 标记节点是否已被访问

    dist[start] = 0;  // 起始点到自身的距离为0

    for (int count = 0; count < vexNum - 1; ++count) {
        int u = -1;
        // 选择未访问的节点中距离最短的节点
        for (int i = 0; i < vexNum; ++i) {
            if (!visited[i] && (u == -1 || dist[i] < dist[u])) {
                u = i;
            }
        }

        if (dist[u] == numeric_limits<double>::max()) {
            break;  // 如果没有可达的节点了，退出循环
        }

        visited[u] = true;  // 标记节点为已访问

        // 更新从起始点到各节点的距离
        ArcNode* p = vexTable[u].firstArc;
        while (p != NULL) {
            int v = p->adjVex;
            double weight = p->dist;    // 将边权重设置为距离
            if (!visited[v] && (dist[u] + weight) < dist[v]) {
                dist[v] = dist[u] + weight;
                prev[v] = u;
            }
            p = p->nextArc;
        }
    }

    // 构建最短路径
    vector<int> shortestPath;

    int current = end;
    while (current != -1) {
        shortestPath.push_back(current);
        if (vexTable[current].station.stationName == vexTable[start].station.stationName) {
            break;  // 到达起始点，退出循环
        }

        int prevNode = prev[current];
        ArcNode* p = vexTable[prevNode].firstArc;
        while (p != NULL) {
            if (p->adjVex == current) {
                break;
            }
            p = p->nextArc;
        }

        current = prevNode;
    }

    // 将路径反转，得到从起点到终点的顺序
    reverse(shortestPath.begin(), shortestPath.end());

    double time = 0.0;
    int dis = 0;
    int trans = 0;
    int cost = 0;

    // 打印路径
    cout << "从“" << vexTable[start].station.stationName << "”到“" << vexTable[end].station.stationName << "”距离最短的路径是：" << endl;
    printPath(start, end, shortestPath);
}

// 返回指定节点里指定方向的时间表
vector<pair<int, double>> Graph::getTimetable(int index, int drct) {
    vector<pair<int, double>> timeTable;

    if (curr_day == 0 || curr_day == 6) { // 如果查询时间为周末，查找周末时间表
        if (drct == 1) { //如果方向为正，返回正向时间表
            timeTable = vexTable[index].station.weekendScheduleForward;
        }
        else {//如果方向为反，返回反向时间表
            timeTable = vexTable[index].station.weekendScheduleReverse;
        }

    }
    else {
        // 如果查询时间为工作日，查找工作日时间表
        if (drct == 1) {
            timeTable = vexTable[index].station.weekdayScheduleForward;
        }
        else {
            timeTable = vexTable[index].station.weekdayScheduleReverse;
        }

    }

    return timeTable;
}





#endif // !SUBWAYGRAPH_H
