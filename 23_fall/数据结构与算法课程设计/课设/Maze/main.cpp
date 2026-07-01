#include <iostream>
#include <graph.h>

using namespace std;


int main() {
    vector<vector<int>> matrix = {
    {1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1},
    {1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1},
    {1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1},
    {1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1},
    {1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1},
    {1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1},
    {1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1},
    {1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1},
    {1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1},
    {1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1},
    {1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1},
    {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0},
    {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1}
    };

    vector<vector<int>> points;
    int point_num = 0;
    for (int i = 0; i < matrix.size(); ++i)
    {
        for (int j = 0; j < matrix[i].size(); ++j)
        {
            if (matrix[i][j] == 0)
            {
                points.push_back({ i, j });
                // cout << "(" << i << "," << j << ")";
                point_num++;
            }
        }
    }

    Graph graph(points, 13*13 , point_num);

    // 遍历节点并添加边
    for (int i = 0; i < point_num; ++i) {
        int x1 = points[i][0];
        int y1 = points[i][1];

        // 遍历相邻的节点
        for (int j = i + 1; j < point_num; ++j) {
            int x2 = points[j][0];
            int y2 = points[j][1];

            // 如果两个节点相邻，则添加边
            if ((x1 == x2 && abs(y1 - y2) == 1) || (y1 == y2 && abs(x1 - x2) == 1)) {
                graph.InsertArc(i, j);
            }
        }
    }

    cout << "Graph:" << endl;
    //graph.Show();
    graph.ShowMazeMatrix();
    graph.PrintAllPaths(0,point_num - 1);



    return 0;
}
