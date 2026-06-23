from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'table_name', 'record_id', 'created_at']
    list_filter = ['action', 'table_name', 'created_at']
    search_fields = ['user__username', 'table_name', 'record_id']
    readonly_fields = ['user', 'action', 'table_name', 'record_id', 'old_values', 'new_values', 'ip_address', 'user_agent', 'created_at']
    
    fieldsets = (
        ('Audit Information', {
            'fields': ('user', 'action', 'table_name', 'record_id')
        }),
        ('Changes', {
            'fields': ('old_values', 'new_values')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'created_at')
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False