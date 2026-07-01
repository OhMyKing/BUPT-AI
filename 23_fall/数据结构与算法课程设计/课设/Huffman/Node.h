#ifndef NODE_H
#define NODE_H
#include <string>

//定义了霍夫曼树节点
struct Node { 
    char ch;  //字符
    double freq;  //字符频率
    int l;  //左子节点下标
    int r;  //右子节点下标
    std::string code;  //字符对应的编码

    Node(char c, double f, int left, int right, const std::string& cd)
        : ch(c), freq(f), l(left), r(right), code(cd) {}

};

#endif // NODE_H