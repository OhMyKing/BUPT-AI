
def calculate_inversions(state):
    inversions = 0
    for i in range(len(state)):
        for j in range(i + 1, len(state)):
            if state[i] > state[j] and state[i] != 0 and state[j] != 0:
                inversions += 1
    return inversions


def is_solvable(start_state, goal_state):
    start_inversions = calculate_inversions(start_state)
    goal_inversions = calculate_inversions(goal_state)

    return (start_inversions % 2) == (goal_inversions % 2)

if __name__ == "__main__":
    print(is_solvable([0,1,2,3,4,5,6,7,8],[1,2,3,4,5,6,7,8,0]))