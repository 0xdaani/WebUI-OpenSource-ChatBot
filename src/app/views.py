from django.shortcuts import render
from django.http import JsonResponse
from requests.exceptions import Timeout
from django.views.decorators.csrf import csrf_protect
import requests

MAX_MESSAGE_HISTORIQUE = 4
MAX_MESSAGE_HISTORIQUE_PAR_PAIR = MAX_MESSAGE_HISTORIQUE * 2

def index(request):
    return render(request, 'index.html')

def chat_page(request):
    return render(request, 'chat.html')

# Send message to ollama api
@csrf_protect
def chat_api(request):
    if request.method == 'POST':
        user_message = request.POST.get('message', '').strip()

        if 'chat_history' not in request.session:
            request.session['chat_history'] = []
        chat_history = request.session['chat_history']

        # print(f"[chat_history] {chat_history}")

        if not user_message:
            return JsonResponse({
                "status": "error",
                "response": "Message cannot be empty.",
                "code": "empty message"
            }, status=400)
        
        if len(user_message) > 600:
            return JsonResponse({
                "status": "error", 
                "response": "Message too long (max 600 characters).",
                "code": "message too long"
            }, status=400)

        try:
            payload = {
                "model": "mistral",
                "messages": [
                    {
                        "role": "system",
                        "content": "You must answer only in english and in one sentence at all times."
                    },
                    *[{"role": msg["role"], "content": msg["content"]} for msg in chat_history],
                    {
                        "role": "user",
                        "content": user_message
                    }
                ],
                "stream": False
            }
            
            ollama_response = requests.post(
                'http://localhost:11434/api/chat',
                json=payload,
                timeout=30
            )
            ollama_response.raise_for_status()
            

            bot_response = ollama_response.json()['message']['content']

            # Adding chats to history
            chat_history.append({"role": "user", "content": user_message})
            chat_history.append({"role": "assistant", "content": bot_response})

            # Limit to X messages
            if len(chat_history) > MAX_MESSAGE_HISTORIQUE_PAR_PAIR:
                chat_history = chat_history[-MAX_MESSAGE_HISTORIQUE_PAR_PAIR:]
            
            request.session['chat_history'] = chat_history

            return JsonResponse({
                "status": "success",
                "response": bot_response
            })
        
        except Timeout:
            return JsonResponse({
                "status": "error",
                "response": "The chatbot took too long to respond, please try again later.",
                "code": "timeout"
            }, status=500)

        except requests.exceptions.RequestException as e:
            return JsonResponse({
                "status": "error",
                "response": "The chatbot is temporarily unavailable.",
                "code": "server down"
            }, status=500)
