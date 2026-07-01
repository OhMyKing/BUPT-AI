#include <iostream>
template <typename T>
class BinaryTree {
public:
    struct Node {
        T data;
        Node* left;
        Node* right;
        Node(const T& d) : data(d), left(nullptr), right(nullptr) {}
    };

    BinaryTree() : root(nullptr) {}
    ~BinaryTree() { destroy(root); }

    Node* insert(const T& value) { return insert(value, root); }

private:
    Node* root;
    Node* insert(const T& value, Node* node);
    void destroy(Node* node);
};

template <typename T>
typename BinaryTree<T>::Node* BinaryTree<T>::insert(const T& value, Node* node) {
    if (!node) {
        node = new Node(value);
    } else if (value < node->data) {
        node->left = insert(value, node->left);
    } else if (value > node->data) {
        node->right = insert(value, node->right);
    }
    return node;
}

template <typename T>
void BinaryTree<T>::destroy(Node* node) {
    if (node) {
        destroy(node->left);
        destroy(node->right);
        delete node;
    }
}
