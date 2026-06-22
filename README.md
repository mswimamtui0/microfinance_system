# MicroFinance Management System

A comprehensive microfinance management system designed specifically for the Tanzanian market, supporting low to middle-income clients including small business owners, bodaboda riders, farmers, fishermen, artisans, salaried workers, and community groups (VICOBA, SACCOS).

## Features

### Customer Management
- Register customers with full KYC
- NIDA number verification
- Business information tracking
- Guarantor management
- Document upload

### Loan Products
- **Biashara Loan**: 20,000 - 5,000,000 TZS for small businesses
- **Salary Loan**: 100,000 - 20,000,000 TZS for salaried workers
- **Group Loan**: 50,000 - 2,000,000 TZS for VICOBA and SACCOS
- **Emergency Loan**: 20,000 - 500,000 TZS for urgent needs

### Loan Management
- Loan application and approval workflow
- Automatic repayment schedule generation
- Status tracking (Draft → Pending → Approved → Disbursed → Active → Paid)
- Default management

### Payment Processing
- Multiple payment methods: Cash, M-Pesa, Airtel Money, Mixx by Yas, Bank
- Automatic payment allocation
- Payment history tracking

### Collections
- Due today/tomorrow tracking
- Overdue management
- Defaulter monitoring
- Collection reports

### Reporting
- Daily, weekly, monthly reports
- Portfolio analysis
- Collection efficiency
- Default rate tracking

### Role-Based Dashboards
- **Admin**: Full system access
- **Branch Manager**: Branch-specific management
- **Loan Officer**: Client and loan management
- **Teller**: Payment processing
- **Viewer**: Read-only access

## Technology Stack

### Backend
- **Framework**: Django 4.2.7
- **API**: Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: PostgreSQL
- **Other**: django-cors-headers, django-filter

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Charts**: Chart.js
- **HTTP Client**: Axios
- **Routing**: React Router v6

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- Git

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/mswimamtui0/microfinance-system.git
cd microfinance-system

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure PostgreSQL
# Create database: microfinance_db

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver