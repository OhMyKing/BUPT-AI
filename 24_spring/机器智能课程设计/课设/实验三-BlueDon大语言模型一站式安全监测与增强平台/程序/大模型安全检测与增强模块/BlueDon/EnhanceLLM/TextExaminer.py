from transformers import AutoModelForSequenceClassification, AutoTokenizer
import requests
import random
import json
import re

AK = 'f99IebhuVx6pO0fgnKrDl5jh'
SK = 'AsYPu904NNKEPuBMjjDkIy2DU4prbhQl'
way = 'api'

moderationDict_zh = {
                'S': '性内容',
                'H': '仇恨',
                'V': '暴力',
                'HR': '骚扰',
                'SH': '自我伤害',
                'S3': '恋童',
                'H2': '暴力仇恨',
                'V2': '暴力图景'
            }

moderationDict = {
                'S': 'sexual',
                'H': 'hate',
                'V': 'violence',
                'HR': 'harassment',
                'SH': 'self-harm',
                'S3': 'sexual/minors',
                'H2': 'hate/threatening',
                'V2': 'violence/graphic'
            }

def get_access_token():
    """
    使用 AK，SK 生成鉴权签名（Access Token）
    :return: access_token，或是None(如果错误)
    """
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {"grant_type": "client_credentials", "client_id": AK, "client_secret": SK}
    return str(requests.post(url, params=params).json().get("access_token"))

class TextExaminer:
    def __init__(self, way = 'api',model_path='./models.py/Text-Moderation'):
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.session = requests.Session()
        self.access_token = get_access_token()
        self.way = way

    def translate(self, msg):
        url = "https://aip.baidubce.com/rpc/2.0/mt/texttrans/v1?access_token=" + self.access_token()
        
        payload = json.dumps({
        "from": "zh",
        "to": "en",
        "q": msg
        })
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        response = requests.request("POST", url, headers=headers, data=payload)
        response_dict = response.json()
        result = response_dict['result']['trans_result'][0]['dst']
        
        return result
    
    def examine(self, msg):
        """
        审核文本内容
        :param msg: 需要审核的文本
        :return: 审核结果
        """
        result_dict = dict()
        
        if self.way == 'api':
            url = f"https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token={self.access_token}"
            payload = {"text": str(msg)}
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }

            response = self.session.post(url, headers=headers, data=payload)

            # 解析响应的JSON数据
            response_data = response.json()
            print(response_data)

            # 创建一个字典来保存审核结果和问题类型
            result_dict = {
                'conclusion': response_data['conclusion'],
                'issues': []
            }
            
            if response_data["conclusion"] != "不合规":
                return
            
            for issue in response_data['data']:
                issue_type = issue['type']
                if issue_type ==  12:
                    subType = issue['subType']
                issue_msg = issue['msg']

                result_dict['issues'].append({
                    'type': issue_type,
                    'subType':subType,
                    'msg': issue_msg,
                })
        else:
            # 检查是否包含中文字符
            if re.search("[\u4e00-\u9fff]", msg):
                # 翻译中文到英文
                msg = self.translate(msg)

            # 对文本进行分词
            inputs = self.tokenizer(msg, return_tensors="pt")

            # 使用模型预测结果
            outputs = self.model(**inputs)

            # 获取预测的 logits
            logits = outputs.logits

            # 将 logits 转换为概率
            probabilities = logits.softmax(dim=-1).squeeze()

            # 获取模型配置中的标签
            id2label = self.model.config.id2label
            label_prob_pairs = {id2label[idx]: prob.item() for idx, prob in enumerate(probabilities)}

            # 判断是否合规
            if label_prob_pairs['OK'] >= 0.95:
                return None

            # 构造不合规结果字典
            issues = []
            for label, probability in label_prob_pairs.items():
                if label != 'OK' and probability > 0.3:
                    # 根据标签类型添加对应的问题描述
                    msg = moderationDict_zh.get(label, '内容不符合规定')
                    issues.append({'type': 12, 'subType': label, 'msg': msg})

            result_dict = {
                'conclusion': '不合规',
                'issues': issues
            }

        return result_dict