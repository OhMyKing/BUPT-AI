% 设置均值和标准差
mu = 0;  % 均值

% 生成x轴的值
x = linspace(-20, 20, 1000);

% 标准差为5的正态分布曲线
sigma_5 = 5;
y_5 = normpdf(x, mu, sigma_5);

% 标准差为15的正态分布曲线
sigma_15 = 15;
y_15 = normpdf(x, mu, sigma_15);

% 计算交点
x_intersection_5 = 5;
y_intersection_5 = normpdf(x_intersection_5, mu, sigma_5);

x_intersection_15 = 5;
y_intersection_15 = normpdf(x_intersection_15, mu, sigma_15);

% 绘制正态分布曲线
figure;
plot(x, y_5, 'LineWidth', 2, 'DisplayName', '标准差为5的正态分布');
hold on;
plot(x, y_15, 'LineWidth', 2, 'DisplayName', '标准差为15的正态分布');

% 标出交点
scatter(x_intersection_5, y_intersection_5, 'ro', 'DisplayName', '交点1');
scatter(x_intersection_15, y_intersection_15, 'ro', 'DisplayName', '交点2');

% 连接两个交点并标红
line([x_intersection_5, x_intersection_15], [y_intersection_5, y_intersection_15], 'Color', 'red', 'LineStyle', '--', 'DisplayName', '');

% 显示图例
legend();
xlabel('X轴');
ylabel('密度');
grid on;
hold off;



