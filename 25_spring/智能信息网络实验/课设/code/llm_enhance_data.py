import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import os
import time
import json
from tqdm import tqdm

def check_gpu():
    """检查GPU是否可用并打印信息"""
    if torch.cuda.is_available():
        print(f"使用GPU: {torch.cuda.get_device_name(0)}")
        print(f"已分配内存: {torch.cuda.memory_allocated(0) / 1024**2:.2f} MB")
        print(f"预留内存: {torch.cuda.memory_reserved(0) / 1024**2:.2f} MB")
        return True
    else:
        print("CUDA不可用，使用CPU处理。")
        return False

def load_model():
    """加载Qwen模型和分词器"""
    print("正在加载Qwen2.5-1.5B-Instruct模型和分词器...")
    model_name = "Qwen/Qwen2.5-1.5B-Instruct"
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            model_name, 
            device_map="auto", 
            trust_remote_code=True,
            torch_dtype=torch.float16  # 使用半精度以节省内存
        )
        print("模型加载成功！")
        return model, tokenizer
    except Exception as e:
        print(f"加载模型时出错: {str(e)}")
        exit(1)

def enhance_news_title(title, category, model, tokenizer):
    """使用Qwen模型为新闻标题生成内容"""
    try:
        # 格式化提示以便模型更好地理解任务
        prompt = f"""请为以下新闻标题生成一段较短的新闻内容，内容应该与标题相关，体现标题所属的分类，并且包含合理的细节。内容大约150-200字左右。
标题：{title}
分类：{category}
生成的内容："""
        
        # 对提示进行编码
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        # 生成内容
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=200,  # 限制生成内容的长度
                temperature=0.7,     # 控制随机性
                top_p=0.9,           # 使用nucleus sampling
                do_sample=True       # 使用采样以获得更多样化的输出
            )
        
        # 解码并清理生成的文本
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # 提取生成的内容部分（提示之后的内容）
        content = generated_text.split("生成的内容：")[-1].strip()
        
        # 清理CUDA缓存以防止内存问题
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return content
    
    except Exception as e:
        print(f"为'{title}'生成内容时出错: {str(e)}")

def process_file(input_path, output_path, model, tokenizer, resume=False):
    """处理文件并增强每个新闻标题，支持断点续处理"""
    # 检查是否应该从之前的运行中恢复
    progress_file = f"{output_path}.progress"
    processed_indices = set()
    
    if resume and os.path.exists(progress_file):
        try:
            with open(progress_file, 'r', encoding='utf-8') as f:
                progress_data = json.load(f)
                processed_indices = set(progress_data['processed_indices'])
                print(f"从上次运行中恢复。已处理{len(processed_indices)}项。")
        except:
            print("无法加载进度文件。从头开始处理。")
            processed_indices = set()
    
    # 读取所有行
    with open(input_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    
    # 过滤空行
    lines = [line.strip() for line in lines if line.strip()]
    
    enhanced_lines = [""] * len(lines)  # 预分配带有空字符串的列表
    
    # 如果恢复处理，加载现有输出
    if resume and os.path.exists(output_path):
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                existing_output = f.read().split('\n\n')
                for i in processed_indices:
                    if i < len(existing_output) and i < len(enhanced_lines):
                        enhanced_lines[i] = existing_output[i]
        except:
            print("无法加载现有输出。将重新生成所有项。")
    
    # 使用进度条处理
    progress_bar = tqdm(range(len(lines)), desc=f"处理 {os.path.basename(input_path)}")
    
    for i in progress_bar:
        # 如果恢复处理，跳过已处理的项
        if i in processed_indices:
            progress_bar.update(1)
            continue
        
        line = lines[i]
        # 分割标题和类别（它们由空格分隔）
        parts = line.rsplit(maxsplit=1)  # 从右侧分割以分离类别
        if len(parts) == 2:
            title, category = parts
            
            # 生成增强内容
            content = enhance_news_title(title, category, model, tokenizer)
            
            # 按照要求的输出格式进行格式化
            enhanced_line = f"{title}（{category}）\n{content}"
            enhanced_lines[i] = enhanced_line
            
            # 更新进度文件
            processed_indices.add(i)
            with open(progress_file, 'w', encoding='utf-8') as f:
                json.dump({'processed_indices': list(processed_indices)}, f)
            
            # 将当前进度写入输出文件
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write('\n\n'.join([line for line in enhanced_lines if line]))
            
            # 略微延迟以避免潜在的内存问题
            time.sleep(0.1)
        else:
            print(f"跳过无效行: {line}")
    
    # 最终写入输出文件
    with open(output_path, 'w', encoding='utf-8') as file:
        file.write('\n\n'.join([line for line in enhanced_lines if line]))
    
    # 如果成功完成，清理进度文件
    if os.path.exists(progress_file):
        os.remove(progress_file)
    
    print(f"增强数据已保存至 {output_path}")

def main():
    # 检查GPU
    has_gpu = check_gpu()
    
    # 加载模型和分词器
    model, tokenizer = load_model()
    
    # 检查输出文件是否已存在，以避免意外覆盖
    resume = False
    if os.path.exists('./enhanced_train.txt') or os.path.exists('./enhanced_test.txt'):
        choice = input("输出文件已存在。(O)覆盖, (R)恢复, 或 (C)取消? ").lower()
        if choice == 'c':
            print("操作已取消。")
            return
        elif choice == 'r':
            resume = True
    
    # 处理训练集
    print("\n处理训练集...")
    process_file('./train.txt', './enhanced_train.txt', model, tokenizer, resume)
    
    # 处理测试集
    print("\n处理测试集...")
    process_file('./test.txt', './enhanced_test.txt', model, tokenizer, resume)
    
    print("\n数据增强完成！")

if __name__ == "__main__":
    main()