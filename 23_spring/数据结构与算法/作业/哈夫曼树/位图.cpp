#include <iostream>
#include <cstring>
#include <fstream>
#include <vector>

// 定义一个位图类
class Bitmap {
public:
    Bitmap(int n) : size((n + 7) / 8) {
        data = new char[size];
        memset(data, 0, size);
    }

    ~Bitmap() {
        delete[] data;
    }

    void set(int k) {
        data[k / 8] |= (1 << (k % 8));
    }

    bool test(int k) const {
        return data[k / 8] & (1 << (k % 8));
    }

private:
    char* data;
    int size;
};

bool isExist(int key, const Bitmap& bitmap) {
    if (bitmap.test(key)) {
        std::cout << "数据存在: " << key << std::endl;
        return true;
    } else {
        std::cout << "数据不存在: " << key << std::endl;
        return false;
    }
}

int main() {
    // 从文件中读取数据
    std::ifstream infile("data.txt");
    int x;
    std::vector<int> data; 
    
    while (infile >> x) {
        std::cout << "读取到数据: " << x << std::endl;
        data.push_back(x); 
    }
    infile.close();

    // 使用位图来表示数据是否存在
    Bitmap bitmap(10000000);
    for (int i = 0; i < data.size(); i++) {
        bitmap.set(data[i]);
    }
	
	isExist(1234567,bitmap);
	isExist(7654321,bitmap);
	
    return 0;
}
