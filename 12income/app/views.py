from django.http import HttpResponseRedirect, HttpResponse, HttpResponseBadRequest
from django.views.generic.simple import direct_to_template
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from models import UserProfile
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

# index view
def index(request):
    p = {}
    
    if request.user.is_authenticated():
        # if user has logged in show the application page
        p['pn'] = 'home'
        return direct_to_template(request, 'index.html', p)
    else:
        # otherwise show the login page
        if 'error' in request.GET:
            p['error'] = request.GET['error']
        return direct_to_template(request, 'main.html', p)
        
def login_action(request):
    
    if not 'email' in request.POST:
        return HttpResponseRedirect('/?error=login')
        
    email = request.POST['email']
    password =request.POST['password']

    try:
        validate_email(email)
    except ValidationError:
        return HttpResponseRedirect('/?error=login')
    
    # authenticate the login 
    user = authenticate(username = email, password = password)
    
    if user is not None:
        
        # login the user
        login(request, user)
        
        return HttpResponseRedirect('/')
    else:
        
        # login failed
        return HttpResponseRedirect('/?error=login')
        
def signup(request):
    p = {}
    if 'error' in request.GET:
        p['error'] = request.GET['error']
    
    return direct_to_template(request, 'signup.html', p)
    
def signup_action(request):
    if not 'email' in request.POST or request.POST['email'] == '':
        return HttpResponseRedirect('/signup/?error=noemail')
        
    if not 'password' in request.POST or request.POST['password'] == '':
        return HttpResponseRedirect('/signup/?error=nopwd')
        
    if not 'password2' in request.POST or request.POST['password2'] == '':
        return HttpResponseRedirect('/signup/?error=nopwd2')
    
    email = request.POST['email']
    password = request.POST['password']
    password2 = request.POST['password2']

    try:
        validate_email(email)
    except ValidationError:
        return HttpResponseRedirect('/signup/?error=emailerror')
        
    if password != password2:
        return HttpResponseRedirect('/signup/?error=pwdnotmatch')
    
    try:
        user = User.objects.get(username = email)
        return HttpResponseRedirect('/signup/?error=registered')
    except:
        user = User(username = email, email = email)
        user.set_password(password)
        user.save()
        
        profile = UserProfile(user = user)
        profile.save()
        user = authenticate(username = email, password = password)
        login(request,user)
    
    return HttpResponseRedirect('/')
        
@login_required
def logout_action(request):
    logout(request)
    return HttpResponseRedirect('/')
    
@login_required
def reports(request):
    p = {}
    p['pn'] = 'reports'
    
    return direct_to_template(request, 'reports.html', p)
    
@login_required
def settings(request):
    p = {}
    
    return direct_to_template(request, 'settings.html', p)