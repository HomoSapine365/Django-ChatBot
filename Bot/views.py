from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
from .models import Conversation, Message
from django.contrib.auth.models import AnonymousUser
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from io import BytesIO
from .forms import ProfileForm
from .forms import SignupForm
from django.contrib.auth import login
from django.views.decorators.http import require_POST
from django.core.serializers.json import DjangoJSONEncoder
from openai import OpenAI
from django.views.decorators.csrf import csrf_exempt
from django.core.files.uploadedfile import InMemoryUploadedFile
from Bot.models import Profile
import base64
import uuid
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.contrib.auth import logout

def chat_view(request):
    return render(request, 'Bot/chat.html', {
        'messages' : []
    })


@csrf_exempt
def chat_message(request):
    if request.method != "POST":
        return JsonResponse({"reply": "Invalid request"}, status=400)

    if not request.user.is_authenticated:
        count = request.session.get("guest_msg_count", 0)

        if count >= 5:
            return JsonResponse(
                {"reply": "Please login or sign up to continue chatting."},
                status=403
            )

        request.session["guest_msg_count"] = count + 1

    user_text = request.POST.get("message", "").strip()

    client = OpenAI()

    history = request.session.get("chat_history", [])
    history = history[-9:]

    messages = []

    for h in history:
        messages.append({
            "role": h["role"],
            "content": h["text"]
        })

    messages.append({
        "role": "user",
        "content": user_text
    })

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )

        bot_reply = response.choices[0].message.content

        history.append({"role": "user", "text": user_text})
        history.append({"role": "assistant", "text": bot_reply})
        request.session["chat_history"] = history

        return JsonResponse({"reply": bot_reply})

    except Exception as e:
        print("CHAT ERROR:", e)
        return JsonResponse({"reply": "Sorry, server busy"})



def signup_view(request):
    if request.method == "POST":
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            request.session.pop("guest_msg_count", None)
            return redirect("chat_home")
    else:
        form = SignupForm()

    return render(request, "registration/signup.html", {"form": form})


@csrf_exempt
@login_required
def save_conversation(request):
    if request.method != "POST":
        return JsonResponse({"error": "invalid_method"}, status=400)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "bad_json"}, status=400)

    messages = data.get("messages", [])
    if not isinstance(messages, list) or not messages:
        return JsonResponse({"error": "invalid_messages"}, status=400)

    # create conversation
    conv = Conversation.objects.create(
        user=request.user,
        title=(messages[0].get("text") or "Saved Chat")[:40]
    )

    for m in messages:
        sender = (m.get("sender") or "").strip()
        if sender not in ("user", "bot"):
            continue

        Message.objects.create(
            conversation=conv,
            sender=sender,
            text=m.get("text", "")
        )

    return JsonResponse({"status": "ok", "id": conv.id})


@login_required
def download_conversation_pdf(request, conv_id):
    # it will ensure the conversation exists and belongs to the user
    conv = get_object_or_404(Conversation, pk=conv_id, user=request.user)

    # Create PDF in memory
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    left_margin = 15 * mm
    right_margin = 15 * mm
    y = height - 20 * mm

    title = conv.title or f"Conversation {conv.id}"
    p.setFont("Helvetica-Bold", 14)
    p.drawString(left_margin, y, title)
    y -= 10 * mm

    p.setFont("Helvetica", 11)

    messages = conv.messages.order_by('created_at').all()
    for m in messages:
        if y < 30 * mm:
            p.showPage()
            y = height - 20 * mm
            p.setFont("Helvetica", 11)

        # prefix
        prefix = "You: " if m.sender == "user" else "Bot: "
        # wrap text manually
        text = prefix + m.text
        max_width = width - left_margin - right_margin
        # simple word-wrap
        words = text.split()
        line = ""
        line_height = 12
        for w in words:
            test_line = f"{line} {w}".strip()
            if p.stringWidth(test_line, "Helvetica", 11) <= max_width:
                line = test_line
            else:
                p.drawString(left_margin, y, line)
                y -= line_height
                line = w
        if line:
            p.drawString(left_margin, y, line)
            y -= line_height

        y -= 4  # small gap between messages

    p.showPage()
    p.save()
    buffer.seek(0)

    filename = f"{title}.pdf"
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


@login_required
def saved_chats_list(request):
    # list all conversations for this user, newest first
    convs = Conversation.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'Bot/saved_chats_list.html', {'conversations': convs})

@login_required
def saved_chat_detail(request, conv_id):
    conv = get_object_or_404(Conversation, pk=conv_id, user=request.user)
    # messages are related_name='messages' in model
    messages = conv.messages.order_by('created_at').all()
    return render(request, 'Bot/saved_chat_detail.html', {'conversation': conv, 'messages': messages})



@login_required
def profile_view(request):
    profile,_ = Profile.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        form = ProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            return redirect('profile')
    else:
        form = ProfileForm(instance=profile)
    return render(request, 'Bot/profile.html', {'form': form, 'profile': profile})



@login_required
def saved_conversation_json(request, conv_id):
    conv = get_object_or_404(Conversation, pk=conv_id, user=request.user)
    messages = list(conv.messages.order_by('created_at').values('sender', 'text', 'created_at'))
    # convert datetimes to ISO strings via JSON encoder
    return JsonResponse({
        'id': conv.id,
        'title': conv.title,
        'created_at': conv.created_at,
        'messages': messages
    }, encoder=DjangoJSONEncoder)


@require_POST
@login_required
def saved_conversation_rename(request, conv_id):
    conv = get_object_or_404(Conversation, pk=conv_id, user=request.user)
    try:
        payload = json.loads(request.body.decode('utf-8'))
        new_title = (payload.get('title') or '').strip()
    except Exception:
        return JsonResponse({'error': 'bad_json'}, status=400)

    if not new_title:
        return JsonResponse({'error': 'empty_title'}, status=400)

    conv.title = new_title
    conv.save()
    return JsonResponse({'status': 'ok', 'title': conv.title})


@require_POST
@login_required
def saved_conversation_delete(request, conv_id):
    conv = get_object_or_404(Conversation, pk=conv_id, user=request.user)
    conv.delete()
    return JsonResponse({'status': 'ok'})


@require_POST
@login_required
def reset_chat(request):
    request.session.flush()
    return JsonResponse({"status": "ok"})

@login_required
def logout_view(request):
    request.session.flush()
    logout(request)
    return redirect('/')