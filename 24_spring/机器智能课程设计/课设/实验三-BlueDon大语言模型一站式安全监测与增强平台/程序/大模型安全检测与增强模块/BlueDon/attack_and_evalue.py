import argparse
from TestLLM.autodan_ga_eval import autodan_ga_eval
from TestLLM.autodan_ga_eval_use_api import autodan_ga_eval_use_api
from TestLLM.autodan_hga_eval import autodan_hga_eval
from TestLLM.autodan_hga_eval_use_api import autodan_hga_eval_use_api
from TestLLM.get_responses import get_responses
from TestLLM.get_responses_use_api import get_response_use_api
from TestLLM.check_asr import check_asr

def get_args():
    parser = argparse.ArgumentParser(description="Configs")
    parser.add_argument("--llm_way", type=str, default='api')
    parser.add_argument("--method", type=str, default='hga')
    parser.add_argument("--device", type=int, default=0)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--end", type=int, default=520)
    parser.add_argument("--num_steps", type=int, default=100)
    parser.add_argument("--batch_size", type=int, default=256)
    parser.add_argument("--num_elites", type=float, default=0.05)
    parser.add_argument("--crossover", type=float, default=0.5)
    parser.add_argument("--num_points", type=int, default=5)
    parser.add_argument("--iter", type=int, default=5)
    parser.add_argument("--mutation", type=float, default=0.01)
    parser.add_argument("--init_prompt_path", type=str, default="./TestLLM/assets/autodan_initial_prompt.txt")
    parser.add_argument("--dataset_path", type=str, default="./data/harmful_behaviors.csv")
    parser.add_argument("--model", type=str, default="llama2")
    parser.add_argument("--save_suffix", type=str, default="normal")
    parser.add_argument("--API_key", type=str, default=None)

    args = parser.parse_args()
    return args

if __name__ == "__main__":
    args = get_args()
    if args.method == 'hga':
        if args.llm_way == 'api':
            path = autodan_hga_eval_use_api(args)
            filepath = get_response_use_api(path,'autodan_hga')
        else:
            path = autodan_hga_eval(args)
            filepath = get_responses(path,device=args.device ,model=args.model,attack= 'autodan_hga')
    else:
        if args.llm_way == 'api':
            path = autodan_ga_eval_use_api(args)
            filepath = get_response_use_api(path,'autodan_ga')
        else:
            path = autodan_ga_eval(args)
            filepath = get_responses(path,device=args.device ,model=args.model,attack= 'autodan_ga')
    
    check_asr(filepath)