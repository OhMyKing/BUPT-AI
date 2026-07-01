% Load Data
load('data.mat')

% Plot Original Data
figure
hold on
gscatter(X(:, 1), X(:, 2), Y)
plot(Xtest(:, 1), Xtest(:, 2), 'LineStyle', 'none', 'Marker', '>')
legend(["X (class1)", "X (class2)", "X (class3)", "X (class4)", "Xtest"])
title('original data')

% Calculate Information Entropy Before Gaussian Kernel PCA
entropy_before = calculateEntropy(X, Y);
disp(['Information Entropy Before Gaussian Kernel PCA: ', num2str(entropy_before)]);

% Gaussian Kernel PCA
kpca = KernelPca(X, 'gaussian', 'gamma', 2.5, 'AutoScale', true);

% Project Data into Subspace
M = 2;
projected_X = project(kpca, X, M);
projected_Xtest = project(kpca, Xtest, M);

% Plot Data After Gaussian Kernel PCA
figure
hold on
gscatter(projected_X(:, 1), projected_X(:, 2), Y)
plot(projected_Xtest(:, 1), projected_Xtest(:, 2), 'LineStyle', 'none', 'Marker', '>')
title('PCA with Gaussian Kernel')
xlabel('Principal Dim')
ylabel('Second Dim')
legend(["Projected X (class1)", "Projected X (class2)", "Projected X (class3)", "Projected X (class4)", "Projected Xtest"])

% Calculate Information Entropy After Gaussian Kernel PCA
entropy_after = calculateEntropy(projected_X, Y);
disp(['Information Entropy After Gaussian Kernel PCA: ', num2str(entropy_after)]);

function entropy = calculateEntropy(data, labels)
    unique_labels = unique(labels);
    num_classes = length(unique_labels);
    
    entropy = 0;
    
    for i = 1:num_classes
        class_indices = (labels == unique_labels(i));
        class_data = data(class_indices, :);
        class_size = size(class_data, 1);
        
        % Calculate probability
        p = class_size / size(data, 1);
        
        % Avoid log(0) by checking if p is not zero
        if p ~= 0
            % Calculate entropy
            entropy = entropy + p * log2(p);
        end
    end
end

