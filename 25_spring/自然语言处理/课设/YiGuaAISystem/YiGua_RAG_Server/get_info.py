import json
from collections import defaultdict

# 读取JSON文件
def load_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# 统计取值
def count_values(data):
    dynasty_values = set()
    domain_counts = defaultdict(int)
    domains_set = set()
    
    for book in data:
        # 统计朝代
        dynasty_values.add(book["dynasty"])
        
        # 统计领域（去重计数）
        for domain in book["domains"]:
            domain_counts[domain] += 1
            domains_set.add(domain)
    
    return sorted(dynasty_values), sorted(domains_set), domain_counts

# 主函数
def main():
    json_file = "./data/metadata/books.json" 
    data = load_data(json_file)
    
    dynasties, domains, domain_counts = count_values(data)
    
    print("="*40)
    print("朝代取值统计（按字母顺序排序）：")
    print("-"*40)
    for dynasty in dynasties:
        print(f"• {dynasty}")
    
    print("\n" + "="*40)
    print("领域取值统计（按字母顺序排序）：")
    print("-"*40)
    for domain in domains:
        count = domain_counts[domain]
        print(f"• {domain} (出现次数：{count})")
    
    print("\n" + "="*40)
    print(f"共计 {len(dynasties)} 个朝代取值")
    print(f"共计 {len(domains)} 个领域取值")

if __name__ == "__main__":
    main()