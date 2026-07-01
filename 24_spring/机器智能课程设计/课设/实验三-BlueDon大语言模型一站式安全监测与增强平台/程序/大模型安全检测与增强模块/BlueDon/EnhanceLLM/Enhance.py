from flask import Flask, jsonify, request
from TextExaminer import TextExaminer
from Aligner import Aligner

examiner = None
aligners = {}


app = Flask(__name__)

users = {
    'apikey1': {'username': 'user1'},
    'apikey2': {'username': 'user2'}
}

def initExamier():
    examiner = TextExaminer()
    return examiner

def initAligner(model_name = 'aligner-7b-v1.0'):
    aligner = Aligner(model_name)
    return aligner

def checkAnswer(answer, examiner):
    result = examiner.examine(answer)
    answer_safety = True
    answer_examination = None
    if result:
        answer_safety = False
        answer_examination = result
        
    return answer_safety, answer_examination

def improveQuestion(question, examiner):
    result = examiner.examine(question)

    improved_question = question
    question_safety = True
    question_examination = None
    if result:
        questions = []
        for issue in result['issues']:
            questions.append(issue['msg'])
        prefix = str(questions)
        improved_question = "下面的信息可能存在包括"+ prefix + "在内的问题，请注意回答的安全性:\n" + question
        # improved_question = "The following information may contain issues including " + prefix + "Please be mindful of the safety in your responses:\n" + question
        question_safety = False
        question_examination = result
    
    return improved_question, question_safety, question_examination

def improveAnswer(question, answer, examiner, aligner, max_token = 2048):
    improved_answer = answer
    answer_safety = True
    answer_examination = examiner.examine(answer)
    improved_answer = aligner.align(question,answer,max_token)
    if answer_examination:
        answer_safety = False
        answer_examination = examiner.examine(answer)
    return improved_answer, answer_safety, answer_examination

def get_aligner(name):
    # 如果请求的aligner已经存在，则直接返回；否则初始化一个新的aligner并存储在字典中
    if name not in aligners:
        aligners[name] = initAligner(name)
    return aligners[name]

@app.before_first_request
def initialize_global_objects():
    global examiner, aligners

    # 初始化 examiner，如果它尚未初始化
    if examiner is None:
        examiner = initExamier()

    # 初始化默认的 aligner，如果它尚未初始化
    if 'aligner-7b-v1.0' not in aligners:
        aligners['aligner-7b-v1.0'] = initAligner('aligner-7b-v1.0')

@app.route('/api', methods=['POST'])
def my_api():
    
    data = request.json
    api_key = data.get('api_key')

    # 验证API密钥
    user = users.get(api_key)
    if not user:
        return jsonify({'error': 'Invalid API key'}), 401

    use_to = data.get('use_to')
    if use_to == 'question':
        message = data.get('message')
        if message is None:
            return jsonify({'error': 'Missing required parameter: message'}), 400
        improved_question = improveQuestion(message, examiner)
        result = jsonify({'improved_question': improved_question})
    elif use_to == 'answer':
        method = data.get('method', 'aligner+')
        question = data.get('question')
        answer = data.get('answer')
        if method == 'aligner+':
            aligner_name = data.get('aligner', 'aligner-7b-v1.0')
            aligner = get_aligner(aligner_name)
            if question is None or answer is None:
                return jsonify({'error': 'Missing required parameters: question and/or answer'}), 400
            max_token = data.get('max_token', 1024)
            improved_answer, answer_safety, answer_examination = improveAnswer(question, answer, examiner, aligner, max_token)
            result = jsonify({'improved_answer': improved_answer, "answer_safety": answer_safety, "answer_examination": answer_examination})
        elif method == 'aligner':
            aligner_name = data.get('aligner', 'aligner-7b-v1.0')
            if question is None or answer is None:
                return jsonify({'error': 'Missing required parameters: question and/or answer'}), 400
            max_token = data.get('max_token',1024)
            aligner = get_aligner(aligner_name)
            improved_answer = aligner.align(question,answer,max_token) 
            result = jsonify({'improved_answer': improved_answer})
        elif method == 'rule':
            if answer is None:
                return jsonify({'error': 'Missing required parameters: answer'}), 400
            templet = 'sorry, i cannot assistant with you.'
            answer_safety, answer_examination =  checkAnswer(answer, examiner)
            if not answer_safety:
                improved_answer = templet
            else:
                improved_answer = answer
            result = jsonify({'improved_answer': improved_answer, "answer_safety": answer_safety, "answer_examination": answer_examination})
        else:
            return jsonify({'error': 'Unsupported method value'}), 400 
    else:
        return jsonify({'error': 'Unsupported use_to value'}), 400

    return result

@app.route('/')
def index():
    return "API服务已启动成功！"

if __name__ == '__main__':
    with app.test_client() as client:
        # 手动发送一个请求到根路由，触发 @before_first_request
        response = client.get('/')
    
    # 正式启动应用
    app.run(debug=False)
