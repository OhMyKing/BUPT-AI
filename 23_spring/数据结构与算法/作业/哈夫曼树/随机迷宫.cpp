#include <iostream>
#include <fstream>
#include <vector>
#include <random>

using namespace std;

// Function to generate a random maze of size m x n
vector<vector<int>> generateMaze(int m, int n) {
    random_device rd;
    mt19937 gen(rd());
    uniform_int_distribution<> dis(0, 1);

    vector<vector<int>> maze(m, vector<int>(n, 0));

    for (int i = 0; i < m; ++i) {
        for (int j = 0; j < n; ++j) {
            maze[i][j] = dis(gen);
        }
    }

    maze[0][1] = 0;   // Entrance
    maze[m - 1][n - 2] = 0;   // Exit

    return maze;
}

// Function to save maze to a text file
void saveMazeToFile(const vector<vector<int>>& maze) {
    ofstream file("maze.txt");
    if (file.is_open()) {
        for (const auto& row : maze) {
            for (int cell : row) {
                file << cell << " ";
            }
            file << endl;
        }
        file.close();
        cout << "Maze saved to maze.txt" << endl;
    } else {
        cout << "Unable to open file for writing." << endl;
    }
}

int main() {
    int m, n;
    cout << "Enter the number of rows (m): ";
    cin >> m;
    cout << "Enter the number of columns (n): ";
    cin >> n;

    vector<vector<int>> maze = generateMaze(m, n);
    saveMazeToFile(maze);

    return 0;
}
