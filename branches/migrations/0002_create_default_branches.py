from django.db import migrations

def create_branches(apps, schema_editor):
    Branch = apps.get_model('branches', 'Branch')
    
    branches = [
        {
            'name': 'Dar es Salaam HQ',
            'code': 'DSM001',
            'region': 'Dar es Salaam',
            'district': 'Kinondoni',
            'ward': 'Mikocheni',
            'address': 'Mikocheni A, Dar es Salaam',
            'phone': '+255 22 1234567',
            'email': 'hq@microfinance.com',
            'is_active': True
        },
        {
            'name': 'Arusha Branch',
            'code': 'ARU001',
            'region': 'Arusha',
            'district': 'Arusha City',
            'ward': 'Kaloleni',
            'address': 'Kaloleni, Arusha',
            'phone': '+255 27 1234567',
            'email': 'arusha@microfinance.com',
            'is_active': True
        },
        {
            'name': 'Mwanza Branch',
            'code': 'MWZ001',
            'region': 'Mwanza',
            'district': 'Mwanza City',
            'ward': 'Ilemela',
            'address': 'Ilemela, Mwanza',
            'phone': '+255 28 1234567',
            'email': 'mwanza@microfinance.com',
            'is_active': True
        }
    ]
    
    for branch_data in branches:
        branch, created = Branch.objects.get_or_create(
            code=branch_data['code'],
            defaults=branch_data
        )
        if created:
            print(f"✅ Created branch: {branch.name}")
        else:
            print(f"ℹ️ Branch already exists: {branch.name}")

class Migration(migrations.Migration):
    dependencies = [
        ('branches', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(create_branches),
    ]