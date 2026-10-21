import os
from google import genai

PROXY_URL = "http://XVGpm3:GSybS4@95.164.110.240:9817"
os.environ['HTTP_PROXY'] = PROXY_URL
os.environ['HTTPS_PROXY'] = PROXY_URL

API_KEY = "AIzaSyBYf01dC4E37T679S1LfQLjL0QoDZ5zOmo"

client = genai.Client(api_key=API_KEY)

models_to_test = [
    "models/gemini-2.5-flash",
    "models/gemini-1.0-pro",
    "models/gemini-1.5-pro",
]

for m in models_to_test:
    print(f"\nТестируем: {m}")
    try:
        response = client.models.generate_content(
            model=m,
            contents="Say 'Hello USA' if you hear me."
        )
        print(f"✅ УСПЕХ! Ответ: {response.text}")
    except Exception as e:
        print(f"❌ ОШИБКА: {e}")