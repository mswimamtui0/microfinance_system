from django.contrib import admin
from .models import Loan, LoanProduct, LoanSchedule

@admin.register(LoanProduct)
class LoanProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'product_code', 'interest_rate', 'min_amount', 'max_amount', 'is_active']
    list_filter = ['is_active', 'interest_method', 'repayment_frequency']
    search_fields = ['product_name', 'product_code']
    ordering = ['product_name']
    
    fieldsets = (
        ('Product Information', {
            'fields': ('product_name', 'product_code', 'description')
        }),
        ('Amount & Interest', {
            'fields': ('min_amount', 'max_amount', 'interest_rate', 'interest_method')
        }),
        ('Term & Repayment', {
            'fields': ('min_term_months', 'max_term_months', 'repayment_frequency', 'repayment_percentage', 'custom_frequency_days')
        }),
        ('Fees & Penalties', {
            'fields': ('processing_fee', 'penalty_rate', 'grace_period_days', 'max_overdue_days')
        }),
        ('Early Repayment', {
            'fields': ('allow_early_repayment', 'early_repayment_fee')
        }),
        ('Requirements', {
            'fields': ('requires_guarantor', 'requires_collateral')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )