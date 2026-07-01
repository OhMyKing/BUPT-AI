import argparse
from TestLLM.get_responses_enhane_using_aligner import test_enhance_answer_by_aligner
from TestLLM.get_responses_enhane_using_enhance_question import test_enhance_question
from TestLLM.get_responses_enhane_using_rule import test_enhance_answer_by_rule
from TestLLM.get_responses_enhane_using_enhance_question_using_api import test_enhance_question_using_api
from TestLLM.check_asr import check_asr

def get_args():
    parser = argparse.ArgumentParser(description="Configs")
    parser.add_argument("--path", type=str)
    parser.add_argument("--method", type=str, default='aligner')
    parser.add_argument("--model", type=str, default='llama2')
    parser.add_argument("--llm_method", type=str, default='local')
    parser.add_argument("--attack", type=str, default='autodan_hga')
    parser.add_argument("--device", type=str, default='0')

    args = parser.parse_args()
    return args


if __name__ == '__main__':
    args = get_args()
    path = args.path
    if args.method == 'rule':
        filepath = test_enhance_answer_by_rule(path)
    elif args.method == 'aligner':
        filepath = test_enhance_answer_by_aligner(path)
    else:
        if args.llm_method == 'api':
            filepath = test_enhance_question_using_api(path,args.attack)
        else:
            filepath = test_enhance_question(path,args.device,args.model,args.attack)
    check_asr(filepath)