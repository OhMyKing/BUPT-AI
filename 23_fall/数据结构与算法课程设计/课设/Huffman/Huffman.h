#ifndef HUFFMAN_H
#define HUFFMAN_H

#include <Node.h>

#include <iostream>
#include <queue>
#include <vector>
#include <map>
#include <stdexcept>

class Huffman {
private:
    std::vector<Node> nodes;  // 存储 Huffman 树的节点
    std::map<char, std::string> codes;  // 存储字符编码映射表

    // 递归构建字符编码映射表
    void buildCodes(int idx, const std::string& code) {
        if (idx >= 0 && idx < nodes.size()) {
            if (nodes[idx].l == -1 && nodes[idx].r == -1) {  // 叶子节点
                char ch = nodes[idx].ch;
                if (codes.find(ch) == codes.end()) {  // 如果该字符的编码未被记录
                    nodes[idx].code = code;  // 记录节点的编码
                    codes[ch] = code;  // 记录字符和编码的映射关系
                }
            }
            else {  // 非叶子节点
                buildCodes(nodes[idx].l, code + '0');  // 递归添加编码
                buildCodes(nodes[idx].r, code + '1'); 
            }
        }
    }

public:
    // 添加字符节点
    void addNode(char ch, double freq) {
        if (freq <= 0 || freq > 1) {
            throw std::invalid_argument("频率必须在 (0, 1] 范围内");
        }

        for (Node& node : nodes) {
            if (node.ch == ch) {
                node.freq = freq;
                return;  // 更新已有节点并返回
            }
        }

        nodes.push_back({ ch, freq, -1, -1, "" });  // 添加新节点
    }

    // 构建 Huffman 树
    void buildTree() {
        auto comp = [&](int a, int b) { return nodes[a].freq > nodes[b].freq; };
        std::priority_queue<int, std::vector<int>, decltype(comp)> pq(comp);

        for (int i = 0; i < nodes.size(); ++i)
            pq.push(i);

        while (pq.size() > 1) {
            int l = pq.top(); pq.pop();
            int r = pq.top(); pq.pop();

            int idx = nodes.size();
            nodes.push_back({ '\0', nodes[l].freq + nodes[r].freq, l, r, "" });  // 合并节点
            pq.push(idx);
        }

        buildCodes(pq.top(), "");  // 从根节点开始构建编码映射表
    }

    // 获取字符编码映射表
    std::map<char, std::string> getCodes() {
        if (codes.empty()) {
            throw std::logic_error("Huffman 树尚未构建");
        }
        return codes;
    }

    // 对字符串进行编码
    std::string encode(const std::string& str) {
        if (codes.empty()) {
            throw std::logic_error("Huffman 树尚未构建");
        }

        std::string res;
        for (char ch : str) {
            char uppercaseCh = std::toupper(ch);  // 转换为大写字母

            if (std::isalpha(ch)) {
                if (codes.find(uppercaseCh) != codes.end()) {
                    res += codes[uppercaseCh];  // 添加字符的编码
                }
            }
            else {
                std::cout << "未编码字符 :\t" << ch << std::endl;
            }
        }
        return res;
    }
};


       

#endif // HUFFMAN_TREE_H
