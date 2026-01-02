from django.contrib import admin
from .models import Conversation, Message, Profile

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'created_at')
    inlines = [MessageInline]


admin.site.register(Profile)