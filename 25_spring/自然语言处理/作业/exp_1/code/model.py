import numpy as np
import torch
import torch.nn as nn

from config import EMBEDDING_DIM


class Word2Vec(nn.Module):
    def __init__(self, vocab_size, embedding_size=EMBEDDING_DIM, padding_idx=0, pretrained_embeddings=None):
        super(Word2Vec, self).__init__()
        self.vocab_size = vocab_size
        self.embedding_size = embedding_size
        
        # 创建目标词和上下文词的嵌入层
        self.target_embeddings = nn.Embedding(vocab_size, embedding_size, padding_idx=padding_idx)
        self.context_embeddings = nn.Embedding(vocab_size, embedding_size, padding_idx=padding_idx)
        
        # 如果提供预训练的词向量，使用它们初始化嵌入层
        if pretrained_embeddings is not None:
            assert pretrained_embeddings.shape[0] == vocab_size, "预训练词向量的词数量必须与词表大小一致"
            assert pretrained_embeddings.shape[1] == embedding_size, "预训练词向量的维度必须与嵌入维度一致"
            
            # 将预训练词向量转换为PyTorch张量
            pretrained_embeddings_tensor = torch.FloatTensor(pretrained_embeddings)
            
            # 初始化目标词和上下文词的嵌入层
            self.target_embeddings.weight.data.copy_(pretrained_embeddings_tensor)
            self.context_embeddings.weight.data.copy_(pretrained_embeddings_tensor)
            print("成功使用预训练词向量初始化嵌入层")
        else:
            # 如果没有预训练词向量，随机初始化
            bound = 0.5 / embedding_size
            nn.init.uniform_(self.target_embeddings.weight.data[1:], -bound, bound)
            nn.init.uniform_(self.context_embeddings.weight.data[1:], -bound, bound)
            print("使用随机初始化嵌入层")
        
    def forward_target(self, target):
        """获取目标词嵌入"""
        return self.target_embeddings(target)
    
    def forward_context(self, context):
        """获取上下文词嵌入"""
        return self.context_embeddings(context)
    
    def get_target_embeddings(self):
        """获取训练后的词向量"""
        return self.target_embeddings.weight.detach().cpu().numpy()

class SGNS(nn.Module):
    def __init__(self, embedding, vocab_size, vocab=None, word_freq=None, n_negs=20):
        super(SGNS, self).__init__()
        self.embedding = embedding
        self.vocab_size = vocab_size
        self.n_negs = n_negs
        
        # 为负采样准备权重
        if word_freq and vocab:
            # 转换为numpy数组并应用0.75的指数
            wf = np.zeros(vocab_size)
            for word, freq in word_freq.items():
                if word in vocab:
                    wf[vocab[word]] = freq
            
            wf = np.power(wf, 0.75)  # 提高低频词的采样频率
            wf = wf / wf.sum()  # 归一化
            self.weights = torch.FloatTensor(wf)
        else:
            self.weights = None
    
    def forward(self, iword, owords):
        batch_size = iword.size(0)
        context_size = owords.size(1)
        
        # 负采样 - 确保设备一致性
        device = iword.device
        if self.weights is not None:
            # 确保权重在正确的设备上
            weights = self.weights.to(device)
            nwords = torch.multinomial(weights, batch_size * context_size * self.n_negs, replacement=True).view(batch_size, -1)
        else:
            # 生成随机张量
            nwords = torch.randint(1, self.vocab_size, (batch_size, context_size * self.n_negs), device=device)
        
        # 获取嵌入
        iword_embeds = self.embedding.forward_target(iword).unsqueeze(2)  # [batch, embed_dim, 1]
        oword_embeds = self.embedding.forward_context(owords)  # [batch, context_size, embed_dim]
        nword_embeds = self.embedding.forward_context(nwords).neg()  # [batch, context_size*n_negs, embed_dim]
        
        # 计算正样本损失
        pos_score = torch.bmm(oword_embeds, iword_embeds).squeeze()  # [batch, context_size] 或者 [batch] 如果context_size=1
        
        # 检查pos_score的维度，并相应地处理
        if pos_score.dim() == 1:  # 如果是一维张量，形状为[batch]
            pos_loss = torch.log(torch.sigmoid(pos_score))  # [batch]
        else:  # 二维张量，形状为[batch, context_size]
            pos_loss = torch.mean(torch.log(torch.sigmoid(pos_score)), dim=1)  # [batch]
        
        # 计算负样本损失
        neg_score = torch.bmm(nword_embeds, iword_embeds).squeeze()  # [batch, context_size*n_negs]
        
        # 同样检查维度
        if neg_score.dim() == 1:  # 一维张量
            neg_loss = torch.log(torch.sigmoid(neg_score))
        else:
            neg_score = neg_score.view(batch_size, context_size, self.n_negs)  # [batch, context_size, n_negs]
            neg_loss = torch.mean(torch.sum(torch.log(torch.sigmoid(neg_score)), dim=2), dim=1)  # [batch]
        
        # 总损失
        return -torch.mean(pos_loss + neg_loss)
