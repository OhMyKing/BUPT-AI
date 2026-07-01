#ifndef NODE_H
#define NODE_H

#include "SubwayStation.h"


// 边节点
struct ArcNode
{
	int adjVex;			// 下一个站点序号
	int line;			// 线路信息
	int drct;			// 方向信息
	double time;		// 时间信息
	int dist;			// 距离信息
	ArcNode* nextArc;	//指向下一条边

	ArcNode() :nextArc(NULL) {}

	//构造函数
	ArcNode(int _adjVex,int _dist, double _time,int _line,int _drct, ArcNode* _nextArc = NULL) :adjVex(_adjVex), nextArc(_nextArc), line(_line),time(_time),drct(_drct),dist(_dist) {}
};

//站点节点
struct VexNode
{
	SubwayStation station;	// 站点信息
	ArcNode* firstArc;		// 指向第一条边

	VexNode() :firstArc(NULL) {}

	//构造函数
	VexNode(SubwayStation _station, ArcNode* _firstArc = NULL)
	{
		station = _station;
		firstArc = _firstArc;
	}
};

#endif // !NODE_H

