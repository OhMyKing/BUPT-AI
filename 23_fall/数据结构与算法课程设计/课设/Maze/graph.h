#ifndef GRAPH_H   
#define GRAPH_H

#include <iostream>
#include <queue>

#include "node.h"
#include "stack.h"

using namespace std;

#define DEFAULT_SIZE 9999

enum VisitStatus { VISIT, UNVISIT };

struct PathInfo {
	int currentVex;       // 当前正在探索的顶点
	ArcNode* currentArc;  // 当前正在考虑的弧
	vector<int> path;     // 到目前为止遍历的路径

    PathInfo() : currentVex(0), currentArc(nullptr) {}

	PathInfo(int vex, ArcNode* arc) : currentVex(vex), currentArc(arc) {
		path.push_back(vex);
	}
};

class Graph
{
public:
	Graph(const vector<vector<int>>& points, int _vexMaxNum, int _vexNum);	//构造函数
	~Graph();										//析构函数
	void InsertArc(int vex1, int vex2);				//插入边
	void Show();									//打印所有点以及与该点连通的点
	void PrintAllPaths(int startVex, int endVex);	//打印所有路径
	void ShowMazeMatrix(int mazeSize);				//在终端中打印图


private:
	VisitStatus* tag;								// 标记节点访问状态
	VexNode* vexTable;								// 节点表
	int vexNum;										// 点的数量
	int vexMaxNum;									// 储存点的最大值
	int arcNum;										// 边的数量
	vector<vector<int>> allPaths;					// 存储所有路径
	vector<int> shortestPath;						// 存储最短路径
	void FindAllPaths(int startVex, int endVex);	// 寻找所有路径

};

Graph::Graph(const vector<vector<int>>& points, int _vexMaxNum, int _vexNum) {
    vexMaxNum = _vexMaxNum;  // 顶点的最大数量
    vexNum = _vexNum;  // 实际顶点数量
    arcNum = 0;  // 弧的数量初始为0
    tag = new VisitStatus[vexMaxNum];  // 分配存储顶点访问状态的数组
    vexTable = new VexNode[vexMaxNum];  // 分配存储顶点信息的数组

    for (int i = 0; i < vexNum; i++) {
        tag[i] = UNVISIT;  // 初始化顶点的访问状态为未访问
        vexTable[i] = VexNode(0, 0);  // 初始化顶点信息
        vexTable[i].x = points[i][0];  // 设置顶点的 x 坐标
        vexTable[i].y = points[i][1];  // 设置顶点的 y 坐标
    }
}

Graph::~Graph() {
    if (tag != NULL)
        delete[] tag;  // 释放访问状态数组的内存
    if (vexTable != NULL) {
        for (int i = 0; i < vexNum; ++i)
            delete vexTable[i].firstArc;  // 删除顶点的邻接表
        delete[] vexTable;  // 释放顶点信息数组的内存
    }
}

void Graph::InsertArc(int vex1, int vex2) {
    vexTable[vex1].firstArc = new ArcNode(vex2, vexTable[vex1].firstArc);  // 在 vex1 的邻接表中插入 vex2
    vexTable[vex2].firstArc = new ArcNode(vex1, vexTable[vex2].firstArc);  // 在 vex2 的邻接表中插入 vex1
    arcNum++;  // 弧的数量增加
}

void Graph::Show() {
    for (int i = 0; i < vexNum; i++) {
        cout << "( " << vexTable[i].x << " , " << vexTable[i].y << " )" << ": ";
        ArcNode* p = vexTable[i].firstArc;  // 获取顶点 i 的邻接表头指针
        while (p != NULL) {
            cout << p->adjVex << " ";  // 输出与顶点 i 相邻的顶点编号
            p = p->nextArc;  // 移动到下一个邻接点
        }
        cout << endl;
    }
}

void Graph::ShowMazeMatrix(int mazeSize = 13) {
    vector<vector<int>> maze(mazeSize, vector<int>(mazeSize, 1));  // 初始化迷宫矩阵，全部设为墙壁

    for (int i = 0; i < vexNum; i++) {
        int x = vexTable[i].x;
        int y = vexTable[i].y;
        maze[x][y] = 0;  // 将顶点对应的位置设为0，表示空地
    }

    // 打印迷宫矩阵
    cout << "   ";
    for (int i = 0; i < mazeSize; i++) {
        cout << i << (i < 10 ? "  " : " ");
    }
    cout << endl;
    for (int i = 0; i < mazeSize; i++) {
        cout << i << (i < 10 ? "  " : " ");
        for (int j = 0; j < mazeSize; j++) {
            if (maze[i][j] == 0) {
                cout << "   ";  // 空地
            }
            else {
                cout << "#  ";  // 墙壁
            }
        }
        cout << endl;
    }
}

void Graph::FindAllPaths(int startVex, int endVex) {
    Stack<PathInfo> pathStack;
    PathInfo initialPath(startVex, vexTable[startVex].firstArc);

    pathStack.push(initialPath);

    while (!pathStack.empty()) {
        PathInfo currentPath = pathStack.top();
        pathStack.pop();

        int currentVex = currentPath.currentVex;
        ArcNode* currentArc = currentPath.currentArc;

        // 探索当前顶点的弧
        while (currentArc) {
            int adjVex = currentArc->adjVex;

            if (adjVex == endVex) {
                // 找到到达目标顶点的路径
                currentPath.path.push_back(endVex);
                allPaths.push_back(currentPath.path);
            }
            else if (find(currentPath.path.begin(), currentPath.path.end(), adjVex) == currentPath.path.end()) {
                // 仅在相邻顶点不在当前路径中时继续
                PathInfo newPath(adjVex, vexTable[adjVex].firstArc);
                newPath.path = currentPath.path;  // 复制现有路径
                newPath.path.push_back(adjVex);  // 添加新顶点
                pathStack.push(newPath);
            }

            currentArc = currentArc->nextArc;
        }
    }
}

void Graph::PrintAllPaths(int startVex, int endVex) {
    if (startVex == endVex) {
        cout << "请输入两个不同的点！" << endl;
        return;  // 提前返回，不进行路径查找
    }

    FindAllPaths(startVex, endVex);

    cout << "\n\n（编码模式为(x,z)）" << endl;
    cout << "从顶点 " << startVex << " 到 " << endVex << " 的所有可用路径：" << endl;

    if (!allPaths.empty()) {
        for (const vector<int>& path : allPaths) {
            for (int vertex : path) {
                cout << "(" << vexTable[vertex].y << ", " << vexTable[vertex].x << ") ";
            }
            cout << "\n\n";
        }

        // 找到最短路径(s)
        vector<int> shortestPaths;  // 存储最短路径的索引
        int shortestPathLength = numeric_limits<int>::max();  // 初始化为一个大值

        for (size_t i = 0; i < allPaths.size(); ++i) {
            if (allPaths[i].size() < shortestPathLength) {
                shortestPathLength = allPaths[i].size();
                shortestPaths.clear();  // 重置最短路径列表
                shortestPaths.push_back(i);
            }
            else if (allPaths[i].size() == shortestPathLength) {
                shortestPaths.push_back(i);
            }
        }

        cout << "最短路径：" << endl;
        for (int pathIndex : shortestPaths) {
            for (int vertex : allPaths[pathIndex]) {
                cout << "(" << vexTable[vertex].y << ", " << vexTable[vertex].x << ") ";
            }
            cout << endl;
        }
    } else {
        cout << "没有找到路径。" << endl;
    }
}



#endif //!GRAPH_H