#include <stdio.h>
#include <stdlib.h>
#include <string.h>


#define MAX_PROCESSES 100
#define MAX_RESOURCES 4  // A, B, C, IO 四种系统资源
#define MAX_PRIORITY 3   // 优先级从高到低依次为 0, 1, 2

typedef enum { READY, RUNNING, BLOCKED, DEAMON } State;
// 系统安全状态
typedef enum {
    SAFE,                        // 系统处于安全状态
    UNSAFE,                      // 系统处于不安全状态
    RESOURCE_EXCEEDS_AVAILABLE,  // 请求超过可用资源
    REQUEST_EXCEEDS_MAX_CLAIM    // 请求超过最大声明
} SafetyStatus;


typedef struct Process {
    int pid;                           // 进程ID
    int priority;                      // 优先级
    State state;                       // 进程状态
    int resources[MAX_RESOURCES];      // 已分配的资源数量
    int max_resources[MAX_RESOURCES];  // 最大资源需求
    struct Process* parent;            // 父进程指针
    struct Process* children[MAX_PROCESSES];  // 子进程数组
    int child_count;                  // 子进程数量
    int is_daemon;                    // 守护进程标志
} Process;

typedef struct Resource {
    char rid;                         // 资源ID
    int total_units;                  // 资源总量
    int available_units;              // 可用资源量
    Process* waiting_list[MAX_PROCESSES];  // 等待该资源的进程队列
    int wait_count;                   // 等待进程数量
} Resource;

// 系统结构体
typedef struct System {
    Process* process_list[MAX_PROCESSES];   // 系统进程列表
    int process_count;                      // 系统中的进程数量
    Process* ready_list[MAX_PRIORITY][MAX_PROCESSES];  // 多级就绪队列
    int ready_count[MAX_PRIORITY];          // 各优先级就绪进程数量
    Resource resources[MAX_RESOURCES];       // 系统资源列表
    Process* current_process;               // 当前运行进程
    Process* daemon_process;                // 守护进程指针
    int pid_counter;                        // PID计数器
    int deadlock_avoidance;                 // 死锁避免开关
    int deadlock_detected;                  // 死锁检测标志
} System;

// 全局系统变量
System sys;

// 函数声明
void boot_screen();
void init_system();
Process* find_process(int pid);
Resource* find_resource(char rid);
void create_process(int priority);
void destroy_process(int pid);
void force_destroy_process(int pid);
void destroy_process_recursive(Process* process, int force_destroy_children);
void request_resource(char rid, int units);
void block_process(Process* process, Resource* resource);
void release_resource(char rid, int units);
void request_io();
void io_completion();
void timeout();
void activate_process(int pid);
void scheduler();
void add_to_ready_queue(Process* process);
void remove_from_ready_queue(Process* process);
void list_status();
void set_max_resources(Process* process);
SafetyStatus is_safe_state(Process* process, int request[]);  // 银行家算法
void check_deadlock();
void shell();

int main() {
    boot_screen();
    shell();
    return 0;
}

// 启动界面
void boot_screen() {
    system("clear");  // 清屏，可能需要根据您的系统调整
    printf("==========================================================================\n");
    printf("                              Welcome to YunOS                            \n");
    printf("==========================================================================\n");
    printf("      ___           ___           ___           ___           ___     \n");
    printf("     |\\__\\         /\\__\\         /\\__\\         /\\  \\         /\\  \\    \n");
    printf("     |:|  |       /:/  /        /::|  |       /::\\  \\       /::\\  \\   \n");
    printf("     |:|  |      /:/  /        /:|:|  |      /:/\\:\\  \\     /:/\\ \\  \\  \n");
    printf("     |:|__|__   /:/  /  ___   /:/|:|  |__   /:/  \\:\\  \\   _\\:\\~\\ \\  \\ \n");
    printf("     /::::\\__\\ /:/__/  /\\__\\ /:/ |:| /\\__\\ /:/__/ \\:\\__\\ /\\ \\:\\ \\ \\__\\\n");
    printf("    /:/~~/~    \\:\\  \\ /:/  / \\/__|:|/:/  / \\:\\  \\ /:/  / \\:\\ \\:\\ \\/__/\n");
    printf("   /:/  /       \\:\\  /:/  /      |:/:/  /   \\:\\  /:/  /   \\:\\ \\:\\__\\  \n");
    printf("   \\/__/         \\:\\/:/  /       |::/  /     \\:\\/:/  /     \\:\\/:/  /  \n");
    printf("                  \\::/  /        /:/  /       \\::/  /       \\::/  /   \n");
    printf("                   \\/__/         \\/__/         \\/__/         \\/__/    \n");
    printf("==========================================================================\n");

    printf("\n按下回车进入系统shell...\n");
    getchar();  // 等待用户按下回车
    system("cls");  // 清屏
}

// 初始化系统
void init_system() {
    sys.process_count = 0;
    sys.pid_counter = 0;
    sys.current_process = NULL;
    sys.deadlock_avoidance = 0;
    sys.deadlock_detected = 0;

    // 初始化就绪队列
    for (int i = 0; i < MAX_PRIORITY; i++) {
        sys.ready_count[i] = 0;
    }

    // 初始化资源
    sys.resources[0] = (Resource){ 'A', 3, 3, {NULL}, 0 };
    sys.resources[1] = (Resource){ 'B', 3, 3, {NULL}, 0 };
    sys.resources[2] = (Resource){ 'C', 2, 2, {NULL}, 0 };
    sys.resources[3] = (Resource){ 'I', 1, 1, {NULL}, 0 };

    // 创建守护进程
    Process* daemon = (Process*)malloc(sizeof(Process));
    daemon->pid = sys.pid_counter++;
    daemon->priority = 0;  // 最高优先级
    daemon->state = DEAMON;
    daemon->is_daemon = 1;
    daemon->parent = NULL;
    daemon->child_count = 0;
    memset(daemon->resources, 0, sizeof(daemon->resources));
    memset(daemon->max_resources, 0, sizeof(daemon->max_resources));

    // 添加到系统进程列表
    sys.process_list[sys.process_count++] = daemon;
    sys.daemon_process = daemon;

    printf("守护进程已创建 (PID: %d)\n", daemon->pid);
    printf("键入 'help' 以查看命令帮助\n");
}

// 查找进程
Process* find_process(int pid) {
    for (int i = 0; i < sys.process_count; i++) {
        if (sys.process_list[i]->pid == pid) {
            return sys.process_list[i];
        }
    }
    return NULL;
}

// 查找资源
Resource* find_resource(char rid) {
    for (int i = 0; i < MAX_RESOURCES; i++) {
        if (sys.resources[i].rid == rid) {
            return &sys.resources[i];
        }
    }
    return NULL;
}

// 创建新进程
void create_process(int priority) {
    if (priority < 0 || priority >= MAX_PRIORITY) {
        printf("优先级应为 0、1 或 2\n");
        return;
    }

    Process* process = (Process*)malloc(sizeof(Process));
    process->pid = sys.pid_counter++;
    process->priority = priority;
    process->state = READY;
    process->is_daemon = 0;  // 新创建的进程默认不是守护进程
    memset(process->resources, 0, sizeof(process->resources));
    memset(process->max_resources, 0, sizeof(process->max_resources));
    process->parent = sys.current_process;
    process->child_count = 0;
    memset(process->children, 0, sizeof(process->children));

    // 如果开启了死锁避免机制，配置最大资源需求
    if (sys.deadlock_avoidance) {
        printf("为进程 %d 配置最大资源需求:\n", process->pid);
        set_max_resources(process);
    }

    // 添加到系统进程列表
    sys.process_list[sys.process_count++] = process;

    // 添加到父进程的子进程列表
    if (process->parent != NULL) {
        process->parent->children[process->parent->child_count++] = process;
    }

    // 添加到就绪队列
    sys.ready_list[priority][sys.ready_count[priority]++] = process;

    printf("进程 %d 已创建，优先级 %d\n", process->pid, priority);

    // 如果当前没有运行的进程，调用调度器
    if (sys.current_process == NULL) {
        scheduler();
    }
}

// 为进程配置最大资源需求
void set_max_resources(Process* process) {
    for (int i = 0; i < MAX_RESOURCES - 1; i++) {  // 排除 IO 资源
        printf("资源 %c 的最大需求 (0 - %d): ", sys.resources[i].rid, sys.resources[i].total_units);
        int max;
        scanf("%d", &max);
        getchar();  // 吸收换行符
        if (max < 0 || max > sys.resources[i].total_units) {
            printf("无效的最大需求，设置为 0\n");
            max = 0;
        }
        process->max_resources[i] = max;
    }
}

// 递归销毁进程及其子进程
void destroy_process_recursive(Process* process, int force_destroy_children) {
    if (process == NULL) return;

    // 如果是守护进程，拒绝销毁
    if (process->is_daemon) {
        printf("无法销毁守护进程\n");
        return;
    }

    // 处理子进程
    if (process->child_count > 0) {
        if (force_destroy_children) {
            // 递归销毁所有子进程
            Process* children[MAX_PROCESSES];
            int child_count = process->child_count;
            memcpy(children, process->children, sizeof(Process*) * child_count);

            for (int i = 0; i < child_count; i++) {
                destroy_process_recursive(children[i], force_destroy_children);
            }
        }
        else {
            // 将子进程转移给守护进程
            printf("将进程 %d 的子进程转移至守护进程 %d\n",
                process->pid, sys.daemon_process->pid);

            for (int i = 0; i < process->child_count; i++) {
                Process* child = process->children[i];
                child->parent = sys.daemon_process;
                sys.daemon_process->children[sys.daemon_process->child_count++] = child;
                printf("进程 %d 已被转移至守护进程\n", child->pid);
            }
        }
    }

    // 释放持有的资源
    for (int i = 0; i < MAX_RESOURCES; i++) {
        if (process->resources[i] > 0) {
            Process* temp = sys.current_process;
            sys.current_process = process;
            release_resource(sys.resources[i].rid, process->resources[i]);
            sys.current_process = temp;
        }
    }

    // 从就绪队列中安全移除
    int priority = process->priority;
    if (priority >= 0 && priority < MAX_PRIORITY) {
        int found = 0;
        for (int i = 0; i < sys.ready_count[priority] && !found; i++) {
            if (sys.ready_list[priority][i] == process) {
                // 使用memmove来安全移动数组元素
                memmove(&sys.ready_list[priority][i],
                    &sys.ready_list[priority][i + 1],
                    sizeof(Process*) * (sys.ready_count[priority] - i - 1));
                sys.ready_count[priority]--;
                sys.ready_list[priority][sys.ready_count[priority]] = NULL;
                found = 1;
            }
        }
    }

    // 从系统进程列表中安全移除
    for (int i = 0; i < sys.process_count; i++) {
        if (sys.process_list[i] == process) {
            memmove(&sys.process_list[i],
                &sys.process_list[i + 1],
                sizeof(Process*) * (sys.process_count - i - 1));
            sys.process_count--;
            break;
        }
    }

    // 更新父进程的子进程列表
    if (process->parent != NULL) {
        Process* parent = process->parent;
        for (int i = 0; i < parent->child_count; i++) {
            if (parent->children[i] == process) {
                memmove(&parent->children[i],
                    &parent->children[i + 1],
                    sizeof(Process*) * (parent->child_count - i - 1));
                parent->child_count--;
                break;
            }
        }
    }

    // 释放进程内存
    free(process);
}

// 销毁进程
void destroy_process(int pid) {
    Process* process = find_process(pid);
    if (process == NULL) {
        printf("进程 %d 不存在\n", pid);
        return;
    }

    // 检查是否是守护进程
    if (process->is_daemon) {
        printf("无法销毁守护进程\n");
        return;
    }

    if (process == sys.current_process) {
        sys.current_process = NULL;
    }

    // 默认不强制销毁子进程 (force_destroy_children = 0)
    destroy_process_recursive(process, 0);
    printf("进程 %d 已销毁", pid);

    // 如果有子进程被转移到守护进程，显示提示信息
    if (process->child_count > 0) {
        printf("，其子进程已转移至守护进程 %d", sys.daemon_process->pid);
    }
    printf("\n");

    scheduler();
}

void force_destroy_process(int pid) {
    Process* process = find_process(pid);
    if (process == NULL) {
        printf("进程 %d 不存在\n", pid);
        return;
    }

    if (process->is_daemon) {
        printf("无法销毁守护进程\n");
        return;
    }

    if (process == sys.current_process) {
        sys.current_process = NULL;
    }

    // 强制销毁进程及其所有子进程 (force_destroy_children = 1)
    destroy_process_recursive(process, 1);
    printf("进程 %d 及其所有子进程已被强制销毁\n", pid);

    scheduler();
}

// 进程请求资源
void request_resource(char rid, int units) {
    if (sys.current_process == NULL) {
        printf("没有正在运行的进程\n");
        return;
    }
    Resource* resource = find_resource(rid);
    if (resource == NULL) {
        printf("资源 %c 不存在\n", rid);
        return;
    }

    int index = resource - sys.resources;

    // 检查是否超过系统总资源量
    if (units + sys.current_process->resources[index] > resource->total_units) {
        printf("进程 %d 申请资源 %c 失败: 申请量(%d) + 已持有量(%d) 超过系统总资源量(%d)\n",
            sys.current_process->pid,
            rid,
            units,
            sys.current_process->resources[index],
            resource->total_units);
        return;
    }

    // 启用死锁避免
    if (sys.deadlock_avoidance) {
        // 检查请求是否超过最大需求
        if (units > sys.current_process->max_resources[index] - sys.current_process->resources[index]) {
            printf("请求的资源超过了进程的最大需求\n");
            return;
        }

        // 银行家算法检查
        int request[MAX_RESOURCES] = { 0 };
        request[index] = units;
        SafetyStatus status = is_safe_state(sys.current_process, request);

        switch (status) {
        case SAFE:
            resource->available_units -= units;
            sys.current_process->resources[index] += units;
            printf("进程 %d 获得资源 %c，数量 %d\n", sys.current_process->pid, rid, units);
            break;
        case UNSAFE:
        case RESOURCE_EXCEEDS_AVAILABLE:
        case REQUEST_EXCEEDS_MAX_CLAIM:
            // 已经在 is_safe_state 中打印错误信息，这里不需要做任何事
            break;
        }
    }
    // 不启用死锁避免
    else {
        if (resource->available_units >= units) {
            if (resource->available_units > 0) {
                resource->available_units -= units;
            }
            sys.current_process->resources[index] += units;
            printf("进程 %d 获得资源 %c，数量 %d\n",
                sys.current_process->pid, rid, units);
        }
        else {
            // 资源不足，进程阻塞
            block_process(sys.current_process, resource);
            check_deadlock();
            scheduler();
        }
    }
}

// 阻塞进程
void block_process(Process* process, Resource* resource) {
    process->state = BLOCKED;
    resource->waiting_list[resource->wait_count++] = process;
    printf("进程 %d 阻塞，等待资源 %c\n", process->pid, resource->rid);

    // 从就绪队列中移除
    int priority = process->priority;
    for (int i = 0; i < sys.ready_count[priority]; i++) {
        if (sys.ready_list[priority][i] == process) {
            // 使用memmove安全地移动数组元素
            memmove(&sys.ready_list[priority][i],
                &sys.ready_list[priority][i + 1],
                sizeof(Process*) * (sys.ready_count[priority] - i - 1));
            sys.ready_count[priority]--;
            break;
        }
    }
}

// 银行家算法安全性检查
SafetyStatus is_safe_state(Process* process, int request[]) {
    /* 银行家算法安全性检查
     * STEP 1: 初始化工作数组和完成数组
     * - work[i] = 当前可用资源数 - 请求数
     * - finish[i] = 0 表示进程i未完成
     */
    int work[MAX_RESOURCES];
    int finish[MAX_PROCESSES] = { 0 };
    int need[MAX_PROCESSES][MAX_RESOURCES];
    int allocation[MAX_PROCESSES][MAX_RESOURCES];

    // STEP 2: 验证资源请求的合法性
    // 初始化work为当前可用资源数
    for (int i = 0; i < MAX_RESOURCES - 1; i++) {  // 排除 IO 资源
        if (request[i] > sys.resources[i].available_units) {
            printf("资源 %c 请求量 %d 超出可用量 %d，请求无法被满足。\n", sys.resources[i].rid, request[i], sys.resources[i].available_units);
            return RESOURCE_EXCEEDS_AVAILABLE;
        }
        work[i] = sys.resources[i].available_units - request[i];
    }

    /* STEP 3: 计算每个进程的Need矩阵
     * need[i][j] = max[i][j] - allocation[i][j]
     * 同时验证请求是否超过最大需求
     */
    // 初始化finish数组和need数组
    for (int i = 0; i < sys.process_count; i++) {
        Process* p = sys.process_list[i];
        for (int j = 0; j < MAX_RESOURCES - 1; j++) {
            allocation[i][j] = p->resources[j];
            need[i][j] = p->max_resources[j] - allocation[i][j];
            if (p == process && request[j] > need[i][j]) {
                printf("进程 %d 请求资源 %c 超过其最大需求量。\n", p->pid, sys.resources[j].rid);
                return REQUEST_EXCEEDS_MAX_CLAIM;
            }
            if (p == process) {
                allocation[i][j] += request[j];
                need[i][j] -= request[j];
            }
        }
    }

    /* STEP 4: 查找安全序列
     * 循环寻找满足条件的进程：
     * 1. 未完成 (finish[i] == 0)
     * 2. 需求小于等于当前可用资源 (need <= work)
     */
    // 查找安全序列
    int process_finished;
    do {
        process_finished = 0;
        for (int i = 0; i < sys.process_count; i++) {
            if (!finish[i]) {
                int can_allocate = 1;
                // 检查是否所有需求都能被满足
                for (int j = 0; j < MAX_RESOURCES - 1; j++) {
                    if (need[i][j] > work[j]) {
                        can_allocate = 0;
                        break;
                    }
                }
                // 如果能满足，标记完成并释放资源
                if (can_allocate) {
                    for (int j = 0; j < MAX_RESOURCES - 1; j++) {
                        work[j] += allocation[i][j];
                    }
                    finish[i] = 1;
                    process_finished = 1;
                }
            }
        }
    } while (process_finished);

    /* STEP 5: 验证是否所有进程都能完成
     * 如果存在未完成的进程，说明系统不安全
     */
    for (int i = 0; i < sys.process_count; i++) {
        if (!finish[i]) {
            printf("系统在分配后将进入不安全状态，进程 %d 无法完成。\n", sys.process_list[i]->pid);
            return UNSAFE;
        }
    }
    return SAFE;
}

// 进程释放资源
void release_resource(char rid, int units) {
    if (sys.current_process == NULL) {
        printf("没有正在运行的进程\n");
        return;
    }

    Resource* resource = find_resource(rid);
    if (resource == NULL) {
        printf("资源 %c 不存在\n", rid);
        return;
    }

    int index = resource - sys.resources;
    if (sys.current_process->resources[index] < units) {
        printf("进程 %d 没有足够的资源 %c 可以释放\n", sys.current_process->pid, rid);
        return;
    }

    sys.current_process->resources[index] -= units;
    resource->available_units += units;
    printf("进程 %d 释放资源 %c，数量 %d\n", sys.current_process->pid, rid, units);

    // 尝试唤醒等待该资源的进程
    for (int i = 0; i < resource->wait_count; i++) {
        Process* waiting_process = resource->waiting_list[i];
        int needed_units = waiting_process->max_resources[index] - waiting_process->resources[index];

        if (resource->available_units >= needed_units) {
            // 检查银行家算法是否安全
            int request[MAX_RESOURCES] = { 0 };
            request[index] = needed_units;

            if (sys.deadlock_avoidance && !is_safe_state(waiting_process, request)) {
                continue;  // 不安全，跳过
            }

            resource->available_units -= needed_units;
            waiting_process->resources[index] += needed_units;
            waiting_process->state = READY;
            sys.ready_list[waiting_process->priority][sys.ready_count[waiting_process->priority]++] = waiting_process;
            printf("进程 %d 被唤醒，获得资源 %c\n", waiting_process->pid, rid);

            // 从等待队列中移除
            for (int j = i; j < resource->wait_count - 1; j++) {
                resource->waiting_list[j] = resource->waiting_list[j + 1];
            }
            resource->wait_count--;
            i--;  // 调整索引
        }
    }

    scheduler();
}

// 进程请求 IO 操作
void request_io() {
    if (sys.current_process == NULL) {
        printf("没有正在运行的进程\n");
        return;
    }

    Resource* io_resource = find_resource('I');

    // 直接将进程从运行态转为阻塞态
    sys.current_process->state = BLOCKED;

    // 加入 IO 等待队列
    io_resource->waiting_list[io_resource->wait_count++] = sys.current_process;
    printf("进程 %d 请求 IO，从运行态进入阻塞状态\n", sys.current_process->pid);

    // 清除当前运行进程
    sys.current_process = NULL;

    // 调用调度器选择下一个进程运行
    scheduler();
}

// IO 操作完成
void io_completion() {
    Resource* io_resource = find_resource('I');
    if (io_resource->wait_count > 0) {
        Process* process = io_resource->waiting_list[0];

        // 确保进程确实处于阻塞状态
        if (process->state == BLOCKED) {
            process->state = READY;
            add_to_ready_queue(process);
            printf("IO 完成，进程 %d 从阻塞态转为就绪态\n", process->pid);

            // 从 IO 等待队列中移除
            for (int i = 0; i < io_resource->wait_count - 1; i++) {
                io_resource->waiting_list[i] = io_resource->waiting_list[i + 1];
            }
            io_resource->wait_count--;

            scheduler();
        }
    }
    else {
        printf("没有进程等待 IO\n");
    }
}

// 进程时间片耗尽
void timeout() {
    if (sys.current_process == NULL) {
        printf("没有正在运行的进程\n");
        return;
    }

    // 将当前进程放回就绪队列尾部
    int priority = sys.current_process->priority;
    sys.current_process->state = READY;
    sys.ready_list[priority][sys.ready_count[priority]++] = sys.current_process;

    printf("进程 %d 时间片耗尽，进入就绪队列\n", sys.current_process->pid);

    // 清除当前进程
    sys.current_process = NULL;

    // 调用调度器选择下一个进程
    scheduler();
}

void activate_process(int pid) {
    Process* target = find_process(pid);
    if (target == NULL) {
        printf("进程 %d 不存在\n", pid);
        return;
    }

    // 如果目标进程是守护进程，无法操作
    if (target->is_daemon == 1) {
        printf("进程 %d 是守护进程，用户无法激活\n", pid);
        return;
    }

    // 如果目标进程已经在运行，无需操作
    if (target->state == RUNNING) {
        printf("进程 %d 已经在运行\n", pid);
        return;
    }

    // 如果目标进程处于阻塞态，不能强制激活
    if (target->state == BLOCKED) {
        printf("进程 %d 当前处于阻塞态，无法激活\n", pid);
        printf("请等待其所需资源可用或 IO 操作完成\n");
        return;
    }

    // 如果当前有运行的进程，将其加入就绪队列
    if (sys.current_process != NULL) {
        sys.current_process->state = READY;
        add_to_ready_queue(sys.current_process);
    }

    // 从就绪队列中移除目标进程
    remove_from_ready_queue(target);

    // 激活目标进程
    sys.current_process = target;
    target->state = RUNNING;
    printf("进程 %d 已激活\n", pid);
}



// 进程调度器
void scheduler() {
    // 如果当前有运行的进程且不是被阻塞的，先将其设为就绪状态
    if (sys.current_process != NULL && sys.current_process->state != BLOCKED) {
        sys.current_process->state = READY;
        add_to_ready_queue(sys.current_process);
    }
    sys.current_process = NULL;

    // 从最高优先级开始查找可运行的进程
    for (int p = 0; p < MAX_PRIORITY; p++) {
        if (sys.ready_count[p] > 0) {
            // 查找第一个非阻塞的进程
            for (int i = 0; i < sys.ready_count[p]; i++) {
                Process* candidate = sys.ready_list[p][i];
                if (candidate->state != BLOCKED) {
                    // 找到可运行进程，将其从就绪队列中移除
                    for (int j = i; j < sys.ready_count[p] - 1; j++) {
                        sys.ready_list[p][j] = sys.ready_list[p][j + 1];
                    }
                    sys.ready_count[p]--;

                    // 设置为当前运行进程
                    sys.current_process = candidate;
                    sys.current_process->state = RUNNING;
                    printf("进程 %d 正在运行\n", sys.current_process->pid);
                    return;
                }
            }
        }
    }

    // 没有可运行的进程
    printf("没有可运行的进程\n");
}

// 将进程添加到就绪队列
void add_to_ready_queue(Process* process) {
    if (process == NULL) return;

    int priority = process->priority;
    process->state = READY;
    sys.ready_list[priority][sys.ready_count[priority]++] = process;
}

// 从就绪队列移除进程
void remove_from_ready_queue(Process* process) {
    if (process == NULL) return;

    int priority = process->priority;
    for (int i = 0; i < sys.ready_count[priority]; i++) {
        if (sys.ready_list[priority][i] == process) {
            // 移动后续进程
            for (int j = i; j < sys.ready_count[priority] - 1; j++) {
                sys.ready_list[priority][j] = sys.ready_list[priority][j + 1];
            }
            sys.ready_count[priority]--;
            break;
        }
    }
}


void list_status() {
    printf("\n================================= 进程状态 =================================\n");
    // 打印表头
    printf("PID\tPRIO\tSTATE\t\tMAX\t\tALLOC\t\tNEED\n");
    for (int i = 0; i < sys.process_count; i++) {
        Process* p = sys.process_list[i];
        printf("%d\t%d\t", p->pid, p->priority);
        if (p->state == READY) printf("READY\t\t");
        else if (p->state == RUNNING) printf("RUNNING\t\t");
        else if (p->state == BLOCKED) printf("BLOCKED\t\t");
        else if (p->state == DEAMON) printf("DEAMON\t\t");
        // 输出最大需求
        printf(" ");
        for (int j = 0; j < MAX_RESOURCES - 1; j++) {
            printf("%c:%d ", sys.resources[j].rid, p->max_resources[j]);
        }
        printf("\t");
        // 输出已分配资源
        for (int j = 0; j < MAX_RESOURCES - 1; j++) {
            printf("%c:%d ", sys.resources[j].rid, p->resources[j]);
        }
        printf("\t");
        // 输出需求
        for (int j = 0; j < MAX_RESOURCES - 1; j++) {
            int need = p->max_resources[j] - p->resources[j];
            printf("%c:%d ", sys.resources[j].rid, need);
        }
        printf("\n");
    }

    printf("\n=========== 资源状态 ===========\n");
    // 打印资源表头
    printf("RID\tTOTAL\tAVAIL\tWAITING\n");
    // 打印资源信息
    for (int i = 0; i < MAX_RESOURCES; i++) {
        Resource* r = &sys.resources[i];

        // 打印基本信息
        printf("%c\t%d\t%d\t", r->rid, r->total_units, r->available_units);

        // 处理等待队列
        if (r->wait_count == 0) {
            printf("none\n");
        }
        else {
            // 打印等待进程的PID
            for (int j = 0; j < r->wait_count; j++) {
                printf("%d", r->waiting_list[j]->pid);
                if (j < r->wait_count - 1) {
                    printf(" ");
                }
            }
            printf("\n");
        }
    }
    printf("\n");
}

// 死锁检测
void check_deadlock() {
    /* 死锁检测算法
     * STEP 1: 初始化检测变量和记录数组
     */
    int deadlock = 0;
    Process* involved_processes[MAX_PROCESSES];
    int involved_count = 0;

    memset(involved_processes, 0, sizeof(involved_processes));

    /* STEP 2: 检测资源分配图中的循环等待
     * - 遍历每个资源的等待队列
     * - 检查是否存在循环依赖关系
     */
    for (int i = 0; i < MAX_RESOURCES; i++) {
        Resource* res = &sys.resources[i];
        if (res->wait_count > 0) {
            // 检查每个等待当前资源的进程
            for (int j = 0; j < res->wait_count; j++) {
                Process* p = res->waiting_list[j];
                // 检查该进程是否持有其他资源
                for (int k = 0; k < MAX_RESOURCES; k++) {
                    if (p->resources[k] > 0) {
                        Resource* res2 = &sys.resources[k];
                        // 检查是否有其他进程在等待这些资源
                        for (int l = 0; l < res2->wait_count; l++) {
                            Process* q = res2->waiting_list[l];
                            // 如果找到循环等待，记录死锁
                            if (q->resources[i] > 0) {
                                deadlock = 1;
                                // STEP 3: 记录死锁进程对
                                int already_listed = 0;
                                for (int m = 0; m < involved_count; m += 2) {
                                    if ((involved_processes[m] == p && involved_processes[m + 1] == q) ||
                                        (involved_processes[m] == q && involved_processes[m + 1] == p)) {
                                        already_listed = 1;
                                        break;
                                    }
                                }
                                if (!already_listed) {
                                    if (involved_count < MAX_PROCESSES - 1) {
                                        involved_processes[involved_count++] = p;
                                        involved_processes[involved_count++] = q;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /* STEP 4: 报告死锁情况
    * 如果检测到死锁，打印相关进程信息和建议操作
    */
    sys.deadlock_detected = deadlock;
    if (deadlock) {
        printf("系统检测到可能的死锁。涉及的进程包括:\n");
        for (int i = 0; i < involved_count; i += 2) {
            printf("  - 进程 %d 和进程 %d\n", involved_processes[i]->pid, involved_processes[i + 1]->pid);
        }
        printf("建议的操作：\n");
        printf("  - 考虑强制结束其中一个或多个进程来解除死锁。\n");
        printf("  - 使用 'de [pid]' 命令可以结束特定进程。\n");
    }
}


// 模拟 shell 界面
void shell() {
    char cmd[256];
    init_system();

    while (1) {
        printf("YunOS> ");
        fgets(cmd, sizeof(cmd), stdin);
        cmd[strcspn(cmd, "\n")] = '\0';  // 去除换行符

        if (strlen(cmd) == 0) {
            continue;
        }

        char* args[4];
        int arg_count = 0;
        char* token = strtok(cmd, " ");
        while (token != NULL && arg_count < 4) {
            args[arg_count++] = token;
            token = strtok(NULL, " ");
        }
        if (strcmp(args[0], "help") == 0) {
            printf("可用命令列表及其用法:\n");
            printf("cr [priority] - 创建新进程，指定优先级\n");
            printf("de [pid] [--force] - 销毁指定进程ID的进程，可选参数强制销毁子进程\n");
            printf("req [rid] [units] - 请求资源，指定资源ID和单位数\n");
            printf("rel [rid] [units] - 释放资源，指定资源ID和单位数\n");
            printf("act [pid] - 激活指定进程ID的进程\n");
            printf("reqio - 请求IO操作\n");
            printf("iocp - 完成IO操作\n");
            printf("to - 时间片结束，当前进程时间片耗尽\n");
            printf("list - 列出系统当前状态\n");
            printf("setmax [pid] [rid] [units] - 设置指定进程的资源最大需求\n");
            printf("deadlock [on/off] - 开启或关闭死锁避免机制\n");
            printf("exit - 退出shell\n");
        }
        else if (strcmp(args[0], "cr") == 0) {
            if (arg_count != 2) {
                printf("用法：cr [priority]\n");
                continue;
            }
            int priority = atoi(args[1]);
            create_process(priority);
        }
        else if (strcmp(args[0], "de") == 0) {
            if (arg_count < 2 || arg_count > 3) {
                printf("用法：de [pid] [--force]\n");
                printf("  pid      要销毁的进程ID\n");
                printf("  --force  可选参数，强制销毁进程及其所有子进程\n");
                continue;
            }

            int pid = atoi(args[1]);
            int force = 0;

            // 检查是否有 --force 参数
            if (arg_count == 3 && strcmp(args[2], "--force") == 0) {
                force = 1;
            }

            if (force) {
                force_destroy_process(pid);
            }
            else {
                destroy_process(pid);
            }
        }
        else if (strcmp(args[0], "req") == 0) {
            if (arg_count != 3) {
                printf("用法：req [rid] [units]\n");
                continue;
            }
            char rid = args[1][0];
            int units = atoi(args[2]);
            request_resource(rid, units);
        }
        else if (strcmp(args[0], "rel") == 0) {
            if (arg_count != 3) {
                printf("用法：rel [rid] [units]\n");
                continue;
            }
            char rid = args[1][0];
            int units = atoi(args[2]);
            release_resource(rid, units);
        }
        else if (strcmp(args[0], "act") == 0) {
            if (arg_count != 2) {
                printf("用法：act [pid]\n");
                continue;
            }
            int pid = atoi(args[1]);
            activate_process(pid);
        }
        else if (strcmp(args[0], "reqio") == 0) {
            request_io();
        }
        else if (strcmp(args[0], "iocp") == 0) {
            io_completion();
        }
        else if (strcmp(args[0], "to") == 0) {
            timeout();
        }
        else if (strcmp(args[0], "list") == 0) {
            list_status();
        }
        else if (strcmp(args[0], "setmax") == 0) {
            if (arg_count != 4) {
                printf("用法：setmax [pid] [rid] [units]\n");
                continue;
            }
            int pid = atoi(args[1]);
            char rid = args[2][0];
            int units = atoi(args[3]);
            Process* process = find_process(pid);
            if (process == NULL) {
                printf("进程 %d 不存在\n", pid);
                continue;
            }
            int index = -1;
            for (int i = 0; i < MAX_RESOURCES; i++) {
                if (sys.resources[i].rid == rid) {
                    index = i;
                    break;
                }
            }
            if (index == -1) {
                printf("资源 %c 不存在\n", rid);
                continue;
            }
            process->max_resources[index] = units;
            printf("已设置进程 %d 的资源 %c 的最大需求为 %d\n", pid, rid, units);
        }
        else if (strcmp(args[0], "deadlock") == 0) {
            if (arg_count != 2) {
                printf("用法：deadlock [on/off]\n");
                continue;
            }
            if (strcmp(args[1], "on") == 0) {
                sys.deadlock_avoidance = 1;
                printf("已开启死锁避免机制\n");
                // 为已有的进程配置最大资源需求
                for (int i = 1; i < sys.process_count; i++) {
                    Process* p = sys.process_list[i];
                    printf("为进程 %d 配置最大资源需求:\n", p->pid);
                    set_max_resources(p);
                }
            }
            else if (strcmp(args[1], "off") == 0) {
                sys.deadlock_avoidance = 0;
                printf("已关闭死锁避免机制\n");
            }
            else {
                printf("用法：deadlock [on/off]\n");
            }
        }
        else if (strcmp(args[0], "exit") == 0) {
            printf("退出 shell\n");
            break;
        }
        else {
            printf("未知命令\n");
        }
    }
}
