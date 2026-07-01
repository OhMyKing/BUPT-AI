%
% demo1: gaussian kernel pca using KernelPca.m
%

sigema = 1000;
% load sample data and plot------------------------------------------------
load('data.mat')


% gaussian kernel pca------------------------------------------------------

% fit pca model and get the coefficient for projection with dataset 'X'
% setting 'AutoScale' true is reccomended (default:false)
kpca = KernelPca(X, 'gaussian', 'gamma', sigema, 'AutoScale', true);

% set the subspace dimention number M of projected data
% (M <= D, where D is the dimention of the original data)
M = 2;

% project the train data 'X' into the subspace by using the coefficient
projected_X = project(kpca, X, M);



% plot
figure
hold on
gscatter(projected_X(:, 1), projected_X(:, 2), Y)
title(['KPCA结果 (核宽 = ', num2str(sigema), ')'])
xlabel('principal dim')
ylabel('second dim')
legend(["KPCA X (类1)", "KPCA X (类2)", "KPCA X (类3)", "KPCA X (类4)"])





