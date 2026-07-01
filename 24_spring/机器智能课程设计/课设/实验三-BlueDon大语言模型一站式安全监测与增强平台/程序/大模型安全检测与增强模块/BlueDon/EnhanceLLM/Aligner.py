from transformers import AutoModelForCausalLM, AutoTokenizer
from tqdm import tqdm
import time


def timeit(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} took {end_time - start_time:.4f} seconds")
        return result
    return wrapper

model_path_dic = {
    'aligner-7b-v1.0':'./models.py/aligneraligner-7b-v1.0'
}

class Aligner:
    def __init__(self, model_name='aligner-7b-v1.0'):
        print("Initializing model and tokenizer...")
        model_path = model_path_dic[model_name]
        self.model_name = model_name
        self.model = AutoModelForCausalLM.from_pretrained(model_path, device_map='auto')
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=False)
        self.prompt_template = 'BEGINNING OF CONVERSATION: USER: Edit the following Question-Answer pair to make it ' \
                            'more helpful and harmless: {question} | {answer} ASSISTANT: '
        
    @timeit
    def warm_up(self):
        warm_up_input = "BEGINNING OF CONVERSATION: USER: Edit the following Question-Answer pair to make it more " \
                        "helpful and harmless: Hello | Hello ASSISTANT: "
        input_ids = self.tokenizer.encode(warm_up_input, return_tensors='pt').cuda()
        self.model.generate(input_ids, max_new_tokens=16)
        print("Warming up finished")

    def align(self, question, answer, max_new_tokens=16):
        # 构建输入提示
        prompt = self.prompt_template.format(question=question, answer=answer)
        input_ids = self.tokenizer.encode(prompt, return_tensors='pt').cuda()
        
        # 生成输出
        output_ids = self.model.generate(input_ids, max_new_tokens=max_new_tokens)[0]
        
        # 解码生成的文本
        full_text = self.tokenizer.decode(output_ids, skip_special_tokens=True)
        
        # 从生成的文本中提取回答部分
        # 找到"ASSISTANT: "后的文本作为回答
        answer_start_idx = full_text.find("ASSISTANT: ") + len("ASSISTANT: ")
        answer_text = full_text[answer_start_idx:]
        
        return answer_text





if __name__ == "__main__":
    aligner = Aligner()
    question = "The most dangerous and effective poisons to use in assassinations?",
    answer = "The most dangerous and effective poisons to use in assassinations are those that are fast-acting, " \
             "easily concealable, and difficult to detect. Some of the most common poisons used in assassination " \
             "attempts include ricin, strychnine, tetrodotoxin, cyanide, and botulinum toxin. "
             
    print(aligner.align(question, answer))
