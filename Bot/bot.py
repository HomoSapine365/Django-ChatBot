from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_bot_reply(message: str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful, friendly chatbot."},
                {"role": "user", "content": message}
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        print("OpenAI error:", e)
        return "AI is currently unavailable"


