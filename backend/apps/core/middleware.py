import threading
from django.http import JsonResponse

class JSONErrorMiddleware:
    """
    Middleware that converts exceptions into JSON responses
    when the request expects JSON.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        # Check if the request expects JSON
        if request.content_type == 'application/json' or 'application/json' in request.META.get('HTTP_ACCEPT', ''):
            # Log the error here if needed
            return JsonResponse({
                'error': str(exception),
                'detail': 'An internal server error occurred.'
            }, status=500)
        return None

_thread_locals = threading.local()

def get_current_user():
    return getattr(_thread_locals, 'user', None)

class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        if user and not user.is_authenticated:
            user = None
        _thread_locals.user = user
        response = self.get_response(request)
        return response
