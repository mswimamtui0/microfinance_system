from django.contrib import admin
from .models import Branch

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'region', 'district', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active', 'region', 'created_at']
    search_fields = ['name', 'code', 'region', 'district', 'phone', 'email']
    ordering = ['name']
    
    fieldsets = (
        ('Branch Information', {
            'fields': ('name', 'code', 'region', 'district', 'ward')
        }),
        ('Contact Details', {
            'fields': ('address', 'phone', 'email')
        }),
        ('Management', {
            'fields': ('manager', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    actions = ['activate_branches', 'deactivate_branches']
    
    def activate_branches(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} branches activated successfully.")
    activate_branches.short_description = "Activate selected branches"
    
    def deactivate_branches(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} branches deactivated successfully.")
    deactivate_branches.short_description = "Deactivate selected branches"