# all decorators for API


# Decorator for ajax user auth
def login_required_ajax(f):
    def wrapper(request):
        if not request.user.is_authenticated():
            from django.http import HttpResponse
            return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
        return f(request)
    return wrapper