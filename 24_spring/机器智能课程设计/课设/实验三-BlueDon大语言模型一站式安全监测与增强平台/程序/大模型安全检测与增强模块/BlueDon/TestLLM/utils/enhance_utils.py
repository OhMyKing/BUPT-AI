import requests
import json

# API的URL
url = 'http://localhost:5000/api'

def enhanceQuestion(question):
    data = {
    'api_key': 'apikey1',
    'message': question,
    'use_to': 'question'
    }
    response = requests.post(url, json=data)
    response_dict =  response.json()
    
    enhanced_question = None
    if response.status_code == 200:
        enhanced_question = response_dict["improved_question"]
    
    return enhanced_question[0]

def enhanceAnswer(question, answer, method='aligner+', aligner='aligner-7b-v1.0',max_token = 64):
    data = {
    'api_key': 'apikey1',
    'question': question,
    'answer' : answer,
    'aligner': aligner,
    'use_to': "answer",
    'method':method,
    'max_token': max_token
    }
    response = requests.post(url, json=data)
    response_dict = response.json()
    
    return response_dict['improved_answer']