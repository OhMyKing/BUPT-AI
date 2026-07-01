#include <iostream>
#include <vector>
#include <string>

using namespace std;

class State {
public:
    std::vector<int> state;
    State* parent;
    std::string move;
    int depth;
    int cost;
    std::string key;
    std::string map;

    State(std::vector<int> state, State* parent, std::string move, int depth, int cost, std::string key) {
        this->state = state;
        this->parent = parent;
        this->move = move;
        this->depth = depth;
        this->cost = cost;
        this->key = key;
        if (!this->state.empty()) {
            for (int i = 0; i < this->state.size(); i++) {
                this->map += std::to_string(this->state[i]);
            }
        }
    }

    bool operator==(const State& other) const {
        return this->map == other.map;
    }

    bool operator<(const State& other) const {
        return this->map < other.map;
    }
};
