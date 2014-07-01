from django.http import HttpResponseRedirect, HttpResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from app.models import Record, UserProfile, MonthlyReport, MonthlyExpensesByCat, Recurrence
import json
from django.contrib import humanize

def parse_amount(item):
    
    if ':' in item:
        data = item.split(':')
        category = data[0].strip(' \t\n\r')
        amount = data[1].strip(' \t\n\r')
    else:
        category = 'expense'
        amount = item
    
    if '-' in amount:
        amount = amount.replace('-','')
        
    if '+' in amount:
        amount = amount.replace('+','')
        
        if category == 'expense':
            category = 'income'
    else:
        amount = '-' + amount
        
    return amount,category

def update_category_report(record):
    
    try:
        report = MonthlyExpensesByCat.objects.get(user = record.user,
                                                  month = record.added_on.year * 100 + record.added_on.month,
                                                  category = record.category)
    except:
        report = MonthlyExpensesByCat(user = record.user,
                                      month = record.added_on.year * 100 + record.added_on.month,
                                      category = record.category)
        
    if record.amount > 0:
        report.is_income = True
        report.amount = report.amount + record.amount
    else:
        report.amount = report.amount - record.amount
        
    report.count = report.count + 1
    
    report.save()
    

def update_report(user, added_on):
    
    report = MonthlyReport.objects.get(user = user, month = added_on.year*100+added_on.month)
    
    expense_reports = MonthlyExpensesByCat.objects.filter(user = user, month = added_on.year * 100 + added_on.month)
    
    for item in expense_reports:
        item.amount = 0
        item.count = 0
        item.save()
    
    import calendar,datetime
    start_date = datetime.date(added_on.year, added_on.month, 1)
    month_range = calendar.monthrange(added_on.year, added_on.month)
    end_date = datetime.date(added_on.year, added_on.month, month_range[1])
    
    records = Record.objects.filter(added_on__range = (start_date, end_date), user = user)
    
    expense = 0
    income = 0
    total_income_items = 0
    total_expense_items = 0
    
    for record in records:
        if record.amount < 0:
            expense = expense - record.amount
            total_expense_items = total_expense_items + 1
        else:
            income = income + record.amount
            total_income_items = total_income_items + 1
            
        update_category_report(record)
            
    report.expense = expense
    report.incomes = income
    report.total_expense_items = total_expense_items
    report.total_income_items = total_income_items
    report.save()
    
    return report

def check_recurrence(user, request_year, request_month):
    
    from datetime import datetime
    
    now = datetime.now()
    
    if request_year != now.year or request_month != now.month:
        return
    
    items = Recurrence.objects.filter(user = user)
    
    import calendar,datetime
    start_date = datetime.date(now.year, now.month, 1)
    month_range = calendar.monthrange(now.year, now.month)
    end_date = datetime.date(now.year, now.month, month_range[1])
    
    added = False
    
    for item in items:
        records = Record.objects.filter(user = user, is_recurrent = True, added_on__range = (start_date, end_date), category = item.category)
        
        if len(records) == 0 and str(request_year*100 + request_month) not in item.ignore_months:
            
            added_on = datetime.datetime(now.year, now.month, item.day, now.hour, now.minute, now.second)
            
            if added_on > item.origin_record.added_on and item.day <= now.day:
                added = True
                record = Record(user = user, is_recurrent = True, added_on = added_on, category = item.category, amount = item.amount)
                record.save()
                
                profile = user.get_profile()
                profile.account_balance = profile.account_balance + record.amount
                profile.save()
    
    if added:
        update_report(user, record.added_on)
        

def add_record(request):
    if not request.user.is_authenticated():
        return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
    
    item = request.POST['item']
    
    amount,category = parse_amount(item)
            
    record = Record(user = request.user)
    record.category = category
    record.amount = amount
    
    record.added_on = request.POST['date']
    
    record.save()
    record = Record.objects.get(pk = record.pk)
    result = {}
    result['success'] = True
    result['data'] = record.clean_object
    
    report = update_report(request.user, record.added_on)
    
    profile = request.user.get_profile()
    profile.account_balance = profile.account_balance + record.amount
    profile.save()
    
    result['report'] = report.clean_object
    result['balance'] = str(profile.account_balance)
    
    return HttpResponse(content = json.dumps(result), content_type = 'application/json')

def get_records(request, request_year, request_month):
    if not request.user.is_authenticated():
        return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
    
    result = {}
    result['success'] = True
    request_month = int(request_month)
    request_year = int(request_year)
    
    check_recurrence(request.user, request_year, request_month)
    
    try:
        report = MonthlyReport.objects.get(user = request.user, month = request_year * 100 + request_month)
    except:
        report = MonthlyReport(user = request.user, month = request_year * 100 + request_month, budget = request.user.get_profile().monthly_budget)
        report.save()
    
    records = Record.objects.filter(user = request.user, added_on__year = request_year, added_on__month = request_month)
    
    import calendar
    month_range = calendar.monthrange(request_year, request_month)
    
    items = []
    for i in range(1, month_range[1]+1):
        item = {}
        item['date'] = i
        item['records'] = []
        
        for record in records:
            if i == record.added_on.day:
                item['records'].append(record.clean_object)
        
        items.append(item)
        
    result['records'] = items
    result['report'] = report.clean_object
    
    profile = request.user.get_profile()
    result['balance'] = str(profile.account_balance)
    
    return HttpResponse(content = json.dumps(result), content_type = 'application/json')
    
def delete_record(request):
    if not request.user.is_authenticated():
        return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
        
    if 'id' not in request.POST:
        return HttpResponse(content = '{"success":false,"msg":"FAILED"}', content_type = 'application/json')
    
    record = Record.objects.get(pk = request.POST['id'])
    
    if record.is_recurrent:
        recurrence = Recurrence.objects.get(user = request.user, day = record.added_on.day, category = record.category)
        
        if recurrence.record == record:
            recurrence.delete()
        else:
            recurrence.ignore_months = recurrence.ignore_months + str(record.added_on.year*100+record.added_on.month)+','
            recurrence.save()
    
    clone_record = record
    
    result = {}
    result['success'] = True
    
    profile = request.user.get_profile()
    profile.account_balance = profile.account_balance - record.amount
    profile.save()
    
    result['balance'] = str(profile.account_balance)
    
    record.delete()
    
    report = update_report(request.user, clone_record.added_on)
    
    result['report'] = report.clean_object
    
    return HttpResponse(content = json.dumps(result), content_type = 'application/json')
    
def switch_record(request):
    if not request.user.is_authenticated():
        return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
        
    if 'id' not in request.POST:
        return HttpResponse(content = '{"success":false,"msg":"FAILED"}', content_type = 'application/json')
        
    record = Record.objects.get(pk = request.POST['id'])
    record.amount = -record.amount
    
    old_category = record.category
    
    if record.category == 'income':
        record.category = 'expense'
    elif record.category == 'expense':
        record.category = 'income'
    
    record.save()
    
    report = update_report(request.user, record.added_on)
    
    result = {}
    result['success'] = True
    
    result['report'] = report.clean_object
    
    profile = request.user.get_profile()
    profile.account_balance = profile.account_balance + record.amount*2
    profile.save()
    
    result['balance'] = str(profile.account_balance)

    result['data'] = record.clean_object
    
    return HttpResponse(content = json.dumps(result), content_type = 'application/json')
    
def update_record(request):
    if not request.user.is_authenticated():
        return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
        
    id = request.POST['id']
    item = request.POST['item']
    
    record = Record.objects.get(pk = id)
    
    old_category = record.category
    old_amount = record.amount
    
    amount,category = parse_amount(item)
    
    if record.is_recurrent:
        recurrence = Recurrence.objects.get(user = request.user, day = record.added_on.day, category = record.category)
        recurrence.category = category
        recurrence.amount = amount
        recurrence.save()
        
    record.category = category
    record.amount = amount
    
    record.save()
    
    record = Record.objects.get(pk = record.pk)
    
    report = update_report(request.user, record.added_on)
    
    result = {}
    result['success'] = True
    
    result['report'] = report.clean_object
    
    profile = request.user.get_profile()
    profile.account_balance = profile.account_balance - old_amount + record.amount
    profile.save()
    
    result['balance'] = str(profile.account_balance)

    result['data'] = record.clean_object
    
    return HttpResponse(content = json.dumps(result), content_type = 'application/json')
    
def update_record_date(request):
    if not request.user.is_authenticated():
        return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
        
    record = Record.objects.get(pk = request.POST['id'])
    record.added_on = request.POST['date'] + ' ' + str(record.added_on.hour) + ':' + str(record.added_on.minute)
    record.save()
    
    return HttpResponse(content = '{"success":true,"msg":"OK"}', content_type = 'application/json')
    
def switch_record_recurrent(request):
    if not request.user.is_authenticated():
        return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
        
    record = Record.objects.get(pk = request.POST['id'])
    
    try:
        recurrence = Recurrence.objects.get(user = request.user, day = record.added_on.day, category = record.category)
    except:
        recurrence = Recurrence(user = request.user, day = record.added_on.day, category = record.category, origin_record = record)
    
    if record.is_recurrent:
        record.is_recurrent = False
        recurrence.delete()
    else:
        record.is_recurrent = True
        recurrence.amount = record.amount
        recurrence.save()
    
    record.save()
    
    result = {}
    result['success'] = True
    result['data'] = record.clean_object
    
    return HttpResponse(content = json.dumps(result), content_type = 'application/json')
    
def get_annual_reports(request, year):
    if not request.user.is_authenticated():
        return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
        
    result = {}
    result['success'] = True
    year = int(year)
    reports = MonthlyReport.objects.filter(user = request.user, month__range = (year * 100 + 1, year * 100 + 12))
    
    monthly_report = []
    for report in reports:
        monthly_report.append(report.clean_object)
        
    result['monthly_report'] = monthly_report
    
    reports = MonthlyExpensesByCat.objects.filter(user = request.user, month__range = (year * 100 + 1, year * 100 + 12), is_income = False)
    
    category_reports = []
    for report in reports:
        added_before = False
        idx = 0
        for item in category_reports:
            if report.category == item[0]:
                added_before = True
                item[1] = float(item[1]) + float(report.amount)
                category_reports[idx] = item
            idx = idx + 1
            
        if not added_before:
            item = [report.category, str(report.amount)]
            category_reports.append(item)
            
    result['category_report'] = category_reports
        
    return HttpResponse(content = json.dumps(result), content_type = 'application/json')
    
def update_settings(request):
    if not request.user.is_authenticated():
        return HttpResponse(content = '{"success":false,"msg":"NOT_LOGIN"}', content_type = 'application/json')
        
    request.user.email = request.POST['email']
    request.user.username = request.POST['email']
    
    if 'password' in request.POST:
        request.user.set_password(request.POST['password'])
    
    request.user.save()
    
    profile = request.user.get_profile()
    profile.currency_symbol = request.POST['currency_symbol']
    profile.monthly_budget = request.POST['monthly_budget']
    profile.account_balance = request.POST['account_balance']
        
    if request.POST['budget_enabled'] == '1' :
        profile.budget_enabled = True
    else:
        profile.budget_enabled = False
        
    profile.save()
    
    from datetime import datetime
    now = datetime.now()
    
    try:
        report = MonthlyReport.objects.get(user = request.user, month = now.year * 100 + now.month)
    except:
        report = MonthlyReport(user = request.user, month = now.yeawr * 100 + now.month)
    
    report.budget = profile.monthly_budget
    report.save()    
    
    return HttpResponse(content = '{"success":true,"msg":"OK"}', content_type = 'application/json')