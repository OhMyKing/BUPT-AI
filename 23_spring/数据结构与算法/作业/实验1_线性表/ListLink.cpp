#include <iostream>
#include <string>
using namespace std;

template <class T>
struct Node{
    T data;
    struct Node<T> *next;
};

template <class T>
class LinkList{
public:
	//无参构造
    LinkList(){
        front = new Node<T>;
        front->next = NULL;
    }
    
    //含参构造
    LinkList(T a[], int n){
        front = new Node<T>;
        Node<T>* r = front;
        for(int i = 0; i < n; i++){
            Node<T>* s = new Node<T>;
            if(!s){
                cout<<"内存不足"<<endl;
                exit(-1);
            }
            s->data = a[i]; 
            r->next = s;
            r = s;
        }
        r->next = NULL;
    }
	//析构函数，实现销毁
    ~LinkList(){
        Node<T>* p = front;
        while(p){
            front = p;
            p = p->next;
            delete front;
        }
    }
	//打印功能
    void PrintList(){
        Node<T>* p = front->next;
        while(p){
            p->data.print();
            p = p->next;
        }
        cout<<endl;
    }
	//获取链表长度
    int GetLength(){
        int length = 0;
        Node<T>* p = front->next;
        while(p){
            length++;
            p = p->next;
        }
        return length;
    }
	//按位查找
    Node<T>* Get(int i){
        Node<T>* p = front->next;
        int j = 1;
        while(p && j != i){
            p = p->next;
            j++;
        }
        return p;
    }
	//按值查找
    int Locate(T x){
        Node<T>* p = front->next;
        int j = 1;
        while(p){
            if(p->data == x){
                return j;
            }
            p = p->next;
            j++;
        }
        return -1;
    }
	//插入
    void Insert(int i, T x){
        Node<T>* p = front;
        if(i != 1){
            p = Get(i-1);
        }
        if(p){
            Node<T>* s = new Node<T>;
            if(!s){
                cout<<"内存不足"<<endl;
                exit(-1);
            }
            s->data = x;
            s->next = p->next;
            p->next = s;
        }else{
            throw "插入位置错误";
        }
    }
	//删除
    T Delete(int i){
        Node<T>* p = front;
        if(i != 1){
            p = Get(i-1);
        }
        Node<T>* q = p->next;
        p->next = q->next;
        T x = q->data;
        delete q;
        return x;
    }

private:
    Node<T>* front;
};

class PHONEBOOK{
private:
    int m_ID;
    string m_name;
    string m_phone;
    string m_group;

public:
    PHONEBOOK(){
    }

    PHONEBOOK(int id, string name, string phone, string group){
        m_ID = id;
        m_name = name;
        m_phone = phone;
        m_group = group;
    }

    void print(){
        cout<<m_ID<<'\t'<<m_name<<'\t'<<m_phone<<'\t'<<m_group<<endl;
    }

    bool operator ==(const PHONEBOOK &p){
        if(p.m_ID == m_ID){
            return true;
        }else{
            return false;
        }
    }
};

int main(){
	PHONEBOOK pbook[2]={
	{1,"wangdianyun","13800000000","me"},
	{2,"pengkun","123456678","classmates"},
	};
	LinkList<PHONEBOOK>list(pbook,2);
	cout<<"通讯录内容列表："<<endl;
	list.PrintList();
	PHONEBOOK record(3,"wangyusheng","12345678","classmates");
	list.Insert(1,record);
	cout<<"新的通信录内容列表："<<endl;
	list.PrintList();
	PHONEBOOK x = list.Delete(3);
	cout<<"已删除："<<endl;
	x.print();
	cout<<"新的通信录内容列表："<<endl;
	list.PrintList();
	int p = list.Locate(record);
	cout<<"您查找的位置在："<<p<<endl;
}