from django.shortcuts import render
from django.http import HttpResponse
import os
from django.conf import settings

# Create your views here.

def home(request):
    return render(request, 'index.html')

def serve_html(request, path):
    # Try root first
    file_path = os.path.join(settings.BASE_DIR.parent, path)
    if os.path.exists(file_path) and file_path.endswith('.html'):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    
    # Try fa/ subdirectory
    file_path_fa = os.path.join(settings.BASE_DIR.parent, 'fa', path)
    if os.path.exists(file_path_fa) and file_path_fa.endswith('.html'):
        with open(file_path_fa, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    
    # Try en/ subdirectory
    file_path_en = os.path.join(settings.BASE_DIR.parent, 'en', path)
    if os.path.exists(file_path_en) and file_path_en.endswith('.html'):
        with open(file_path_en, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    
    return HttpResponse(status=404)
