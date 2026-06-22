from django.contrib import admin
from .models import LoanProduct, Loan, LoanSchedule

@admin.register(LoanProduct)
class LoanProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'product_code', 'interest_rate', 'min_amount', 'max_amount', 'is_active']
    list_filter = ['is_active', 'interest_method', 'repayment_frequency']
    search_fields = ['product_name', 'product_code']
    ordering = ['product_name']


class LoanScheduleInline(admin.TabularInline):
    model = LoanSchedule
    extra = 0
    readonly_fields = ['installment_no', 'due_date', 'total_due', 'status']


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ['loan_no', 'customer', 'product', 'principal', 'status', 'outstanding_balance']
    list_filter = ['status', 'product', 'branch', 'disbursement_date']
    search_fields = ['loan_no', 'customer__first_name', 'customer__last_name', 'customer__customer_no']
    readonly_fields = ['loan_no', 'total_interest', 'total_payable', 'amount_paid', 'outstanding_balance']
    inlines = [LoanScheduleInline]
    
    fieldsets = (
        ('Loan Information', {
            'fields': ('loan_no', 'customer', 'product', 'branch')
        }),
        ('Amount Details', {
            'fields': ('principal', 'approved_amount', 'interest_rate', 'term_months')
        }),
        ('Repayment', {
            'fields': ('repayment_frequency', 'interest_method')
        }),
        ('Calculations', {
            'fields': ('total_interest', 'total_payable', 'amount_paid', 'outstanding_balance')
        }),
        ('Dates', {
            'fields': ('application_date', 'approval_date', 'disbursement_date', 'maturity_date')
        }),
        ('Status', {
            'fields': ('status', 'is_overdue', 'days_overdue', 'notes')
        }),
    )