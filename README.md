# 🤖 Chat Bot

A Django-based AI Chat Bot application with authentication and chat history.

## ✨ Features
- User Login & Signup
- AI Chat Bot
- Chat History
- Save chats
- Download chats as PDF
- Dark / Light theme
- Image & Voice input

## 🛠 Tech Stack
- Django
- JavaScript
- Bootstrap 5
- OpenAI API
- SQLite (development)

## 📸 Output Screenshots

### Chat Interface
![Chat Output](screenshots/home-page.png)

### Login Page
![Login Page](screenshots/signup-page.png)

### Saved Chats
![Saved Chats](screenshots/saved-chats.png)


## ⚙️ Setup

```bash
git clone https://github.com/yourusername/chat-bot.git
cd chat-bot
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
