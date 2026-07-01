#include <bits/stdc++.h>
using namespace std;

const int MAX = 100;
int g[MAX][MAX];
int color[MAX];
int n, m, Color;

bool is_ok(int c)
{
    for(int i = 0; i < n; i++)
        if(g[c][i] && color[i] == color[c]) return false;
    return true;
}

void graphColoring(int c)
{
    if(c == n)
    {
        Color = min(Color, *max_element(color, color+n));
        return;
    }

    for(int i = 1; i <= n; i++)
    {
        color[c] = i;
        if(is_ok(c)) graphColoring(c+1);
        color[c] = 0;
    }
}

int main()
{
    // n 是节点数，m 是边数
    n = 6; m = 7;
    memset(g, 0, sizeof(g));
    memset(color, 0, sizeof(color));

    // 张凯（0）和李四（2）、张三（3）、李杰（5）有冲突
	g[0][2] = g[2][0] = g[0][3] = g[3][0] = g[0][5] = g[5][0] = 1;
	// 王刚（1）和李杰（5）、王峰（4）有冲突
	g[1][5] = g[5][1] = g[1][4] = g[4][1] = 1;
	// 李四（2）和张凯（0）、王峰（4）有冲突
	g[2][0] = g[0][2] = g[2][4] = g[4][2] = 1;
	// 张三（3）和张凯（0）、王峰（4）有冲突
	g[3][0] = g[0][3] = g[3][4] = g[4][3] = 1;
	// 王峰（4）和张三（3）、李四（2）、王刚（1）有冲突
	g[4][3] = g[3][4] = g[4][2] = g[2][4] = g[4][1] = g[1][4] = 1;
	// 李杰（5）和张凯（0）、王刚（1）有冲突
	g[5][0] = g[0][5] = g[5][1] = g[1][5] = 1;


    Color = INT_MAX;
    graphColoring(0);

    cout << "时间最短的排序方式至少需要" << Color<<"个项目的执行时间 " << endl;

    return 0;
}
