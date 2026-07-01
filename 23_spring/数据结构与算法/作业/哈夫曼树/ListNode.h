#include <iostream>
template <typename T>
class LinkedList {
public:
    struct Node {
        T data;
        Node* next;
        Node(const T& d) : data(d), next(nullptr) {}
    };

    LinkedList() : head(nullptr), size(0) {}
    ~LinkedList();

    void push_back(const T& value);
    size_t length() const { return size; }

private:
    Node* head;
    size_t size;
};

template <typename T>
LinkedList<T>::~LinkedList() {
    while (head) {
        Node* temp = head;
        head = head->next;
        delete temp;
    }
}

template <typename T>
void LinkedList<T>::push_back(const T& value) {
    Node* newNode = new Node(value);
    if (!head) {
        head = newNode;
    } else {
        Node* temp = head;
        while (temp->next) {
            temp = temp->next;
        }
        temp->next = newNode;
    }
    ++size;
}
