from django.db import models
from django.contrib.auth.models import User

# Model class for user profile
class UserProfile(models.Model):
    
    # Foreign key to User
    user = models.ForeignKey(User, unique = True)
    
    # Currency symbol
    currency_symbol = models.CharField(max_length = 10, default = '$')
    
    # Timezone offset
    time_zone_offset = models.FloatField(default = 0)
    
    # Account balance
    account_balance = models.DecimalField(max_digits = 12, decimal_places = 2, db_index = True, default = 0.00)
    
    # Monthly budget
    monthly_budget = models.DecimalField(max_digits = 12, decimal_places = 2, default = 500.00, db_index = True)
    
    # Date format
    date_format = models.CharField(max_length = 50, default = '%Y-%m-%d')
    
    # Last payment date
    last_payment_date = models.DateTimeField(db_index = True, null = True)
    
    # If the budget is enabled
    budget_enabled = models.BooleanField(default = True)


# Model class for book record
class Record(models.Model):
    
    # Foreign key to User
    user = models.ForeignKey(User)
    
    # Category name
    category = models.CharField(max_length = 50, db_index = True)
    
    # Amount the the money this record refer to
    amount = models.DecimalField(max_digits = 12, decimal_places = 2, db_index = True)
    
    # The date time this record was added
    added_on = models.DateTimeField(db_index = True)
    
    # Memo text
    note = models.TextField()
    
    # Is recurrent item
    is_recurrent = models.BooleanField(default = False, db_index = True)
    
    # Clean object for json
    @property
    def clean_object(self):
        object = {}
        object['id'] = self.pk
        object['category'] = self.category
        object['amount'] = str(self.amount)
        object['added_on_day'] = self.added_on.day
                
        object['added_on_time'] = self.added_on.strftime('%H:%M')
        object['note'] = self.note
        object['is_recurrent'] = self.is_recurrent
        return object
    
    class Meta:
        ordering = ['added_on']

# Model class for recurrence item
class Recurrence(models.Model):
    
    # Foreign key to User
    user = models.ForeignKey(User)
    
    # Category name
    category = models.CharField(max_length = 50, db_index = True)
    
    # Amount the the money this record refer to
    amount = models.DecimalField(max_digits = 12, decimal_places = 2, db_index = True)
    
    # Ignore months
    ignore_months = models.TextField(default = '')
    
    # Happen day
    day = models.PositiveSmallIntegerField(default = 1, db_index = True)
    
    # origin record
    origin_record = models.ForeignKey(Record)

# Model class for monthly report
class MonthlyReport(models.Model):
    
    # Foreign key to User
    user = models.ForeignKey(User)
    
    # Month 201101
    month = models.IntegerField(max_length = 6, db_index = True)
    
    # Budget of the month
    budget = models.DecimalField(max_digits = 12, decimal_places = 2, db_index = True)
    
    # Expenses of the month
    expense = models.DecimalField(max_digits = 12, decimal_places = 2, db_index = True, default = 0)
    
    # Incomes of the month
    incomes = models.DecimalField(max_digits = 12, decimal_places = 2, db_index = True, default = 0)
    
    # Total income items
    total_income_items = models.IntegerField(db_index = True, default = 0)
    
    # Total expense items
    total_expense_items = models.IntegerField(db_index = True, default = 0)
    
    # Clean object for json
    @property
    def clean_object(self):
        object = {}
        object['id'] = self.pk
        object['month'] = self.month
        object['budget'] = str(self.budget)
        object['expense'] = str(self.expense)
        object['incomes'] = str(self.incomes)
        object['total_income_items'] = self.total_expense_items
        object['total_expense_items'] = self.total_expense_items
        return object
    
    class Meta:
        ordering = ['month']
    
    
# Model class for report of monthly category expenses
class MonthlyExpensesByCat(models.Model):
    
    # Foreign key to User
    user = models.ForeignKey(User)
    
    # Month 201101
    month = models.IntegerField(max_length = 6, db_index = True)
    
    # Category
    category = models.CharField(max_length = 50, db_index = True)
    
    # Count
    count = models.IntegerField(db_index = True, default = 0)
    
    # Amount
    amount = models.DecimalField(max_digits = 12, decimal_places = 2, db_index = True, default = 0)
    
    # Is income
    is_income = models.BooleanField(default = False, db_index = True)