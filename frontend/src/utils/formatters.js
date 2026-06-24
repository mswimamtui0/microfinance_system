// Currency formatting for Tanzanian Shillings

import { useTranslation } from 'react-i18next';

// Inside the component:
const { t } = useTranslation();

// Replace static text with t():
// "Welcome" → {t('Welcome')}
// "Dashboard" → {t('Dashboard')}
// "Total Portfolio" → {t('Total Portfolio')}

export const formatCurrency = (amount) => {
  if (!amount) return 'TZS 0';
  return `TZS ${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Date formatting
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date with time
export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Phone number formatting (Tanzanian)
export const formatPhone = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Format as 0XXX-XXX-XXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// Truncate text
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

// Generate random ID
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

// Calculate age from date of birth
export const calculateAge = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    // Loan statuses
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    disbursed: 'bg-purple-100 text-purple-800',
    active: 'bg-green-100 text-green-800',
    paid: 'bg-gray-100 text-gray-800',
    defaulted: 'bg-red-100 text-red-800',
    written_off: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    
    // Customer statuses
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    blacklisted: 'bg-red-100 text-red-800',
    deceased: 'bg-red-100 text-red-800',
    
    // Risk levels
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    
    // Schedule statuses
    overdue: 'bg-red-100 text-red-800',
    partial: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};