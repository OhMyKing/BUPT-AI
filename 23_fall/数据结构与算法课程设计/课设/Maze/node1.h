#ifndef NODE_H
#define NODE_H

// 边
struct ArcNode
{
	int adjVex;	//序号
	ArcNode* nextArc;

	ArcNode() :nextArc(NULL) {}

	//构造函数
	ArcNode(int _adjVex, ArcNode* _nextArc = NULL)
	{
		adjVex = _adjVex;
		nextArc = _nextArc;
	}
};

//节点
struct VexNode
{
	int x, y;	//坐标
	ArcNode* firstArc;

	VexNode() :firstArc(NULL) {}

	//构造函数
	VexNode(int _x, int _y, ArcNode* _firstArc = NULL)
	{
		x = _x;
		y = _y;
		firstArc = _firstArc;
	}
};

// 链表节点
struct LinkListNode
{
	int data;
	LinkListNode* next;
};

#endif // !NODE_H
