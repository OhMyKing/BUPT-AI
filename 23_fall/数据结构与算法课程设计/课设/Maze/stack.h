#ifndef STACK_H
#define STACK_H

#include <node.h>

template <typename T>
class Stack {
private:
    struct Node {
        T data;          // 存储数据
        Node* next;      // 下一个节点的指针
    };

    Node* topNode;       // 栈顶节点指针

public:
    Stack() : topNode(nullptr) {}

    // 入栈
    void push(const T& data) {
        Node* newNode = new Node;  // 创建新节点
        newNode->data = data;      // 设置新节点的数据
        newNode->next = topNode;   // 将新节点连接到当前栈顶节点
        topNode = newNode;         // 更新栈顶节点为新节点
    }

    // 出栈
    void pop() {
        if (topNode) {             // 栈非空
            Node* temp = topNode;  // 临时保存栈顶节点指针
            topNode = topNode->next;  // 将栈顶指针指向下一个节点
            delete temp;           // 释放原栈顶节点内存
        }
    }

    // 检查栈是否为空
    bool empty() const {
        return (topNode == nullptr);  // 栈顶节点为空则栈为空
    }

    // 查看栈顶
    T top() const {
        if (topNode)            // 栈非空
            return topNode->data;  // 返回栈顶元素的数据
        return T();             // 返回默认值表示栈为空
    }

    // 析构函数
    ~Stack() {
        while (!empty()) {
            pop();
        }
    }
};





#endif // !STACK_H
