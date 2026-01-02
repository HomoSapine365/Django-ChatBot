from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.chat_view, name = 'chat_home'),
    path('save-conversation/', views.save_conversation, name = 'save_conversation'),
    path('download-pdf/<int:conv_id>/', views.download_conversation_pdf, name = 'download_conversation_pdf'),
    path('saved/', views.saved_chats_list, name = 'saved_chats_list'),
    path('saved/<int:conv_id>/', views.saved_chat_detail, name = 'saved_chat_detail'),
    path('profile/', views.profile_view, name='profile'),
    path('signup/', views.signup_view, name='signup'),
    path('message/', views.chat_message, name='chat_message'),
    path('saved/<int:conv_id>/json/', views.saved_conversation_json, name='saved_conversation_json'),
    path('saved/<int:conv_id>/rename/', views.saved_conversation_rename, name='saved_conversation_rename'),
    path('saved/<int:conv_id>/delete/', views.saved_conversation_delete, name='saved_conversation_delete'),
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path("reset-chat/", views.reset_chat, name="reset_chat"),

]