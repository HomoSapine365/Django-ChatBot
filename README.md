# 🤖 Django Chat Bot

A Django-based AI-powered Chat Bot application with authentication, chat history, and OpenAI integration.

## ✨ Features
- User Authentication (Login & Signup)
- AI-powered Chat Bot
- Chat History & Saved Chats
- Download Chats as PDF
- Dark / Light Theme
- Image & Voice Input

## 🛠 Tech Stack
- Django
- JavaScript
- Bootstrap 5
- OpenAI API
- SQLite (Development)

## 📸 Output Screenshots

### Chat Interface
![Chat Interface](screenshots/home-page.png)

### Login / Signup
![Login Page](screenshots/signup-page.png)

### Saved Chats
![Saved Chats](screenshots/saved-chats.png)

## ⚙️ Setup

Clone the repository, create virtual environment, install dependencies, configure environment variables, run migrations, and start the server:

git clone https://github.com/HomoSapine365/Django-ChatBot.git  
cd Django-ChatBot  
python -m venv venv  
venv\Scripts\activate  (Windows)  
source venv/bin/activate  (Linux / Mac)  
pip install -r requirements.txt  

Create a .env file in the project root and add:  
SECRET_KEY=your_django_secret_key  
OPENAI_API_KEY=your_openai_api_key  

Run the project:  
python manage.py migrate  
python manage.py runserver  

Open in browser:  
http://127.0.0.1:8000/

## 👨‍💻 Author
Nakka Jayanth Vamsi  
Python Full Stack Developer | Django | REST APIs | AI Integration
