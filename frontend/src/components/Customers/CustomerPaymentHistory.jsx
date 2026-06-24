import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentAPI, loanAPI } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Loading from '../Common/Loading';

const CustomerPaymentHistory = ({ customerId, customerName }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all loans for this customer
  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['customer-loans', customerId],
    queryFn: () => loanAPI.getAll({ customer: customerId }),
    enabled: !!customerId,
  });

  // Fetch all payments for this customer
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['customer-payments', customerId],
    queryFn: () => paymentAPI.getAll({ customer: customerId }),
    enabled: !!customerId,
  });

  if (loansLoading || paymentsLoading) {
    return <Loading />;
  }

  const customerLoans = loans?.data?.results || [];
  const customerPayments = payments?.data?.results || [];

  // Calculate totals
  const totalBorrowed = customerLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalPayable = customerLoans.reduce((sum, l) => sum + l.total_payable, 0);
  const totalPaid = customerLoans.reduce((sum, l) => sum + l.amount_paid, 0);
  const totalOutstanding = customerLoans.reduce((sum, l) => sum + l.outstanding_balance, 0);
  const activeLoans = customerLoans.filter(l => l.status === 'active' || l.status === 'disbursed');
  const completedLoans = customerLoans.filter(l => l.status === 'paid');

  // Calculate payment progress
  const paymentProgress = totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0;
  const remainingPercentage = 100 - paymentProgress;

  // Get recent payments
  const recentPayments = customerPayments.slice(0, 5);

  // Format currency function
  const formatCurrencyLocal = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'TZS 0';
    }
    return `TZS ${Number(amount).toLocaleString()}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paid: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      defaulted: 'bg-red-100 text-red-800',
      disbursed: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Customer Header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{customerName}</h2>
        <p className="text-sm text-gray-500">Payment History & Loan Summary</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">Total Borrowed</p>
          <p className="text-xl font-bold text-blue-700">{formatCurrencyLocal(totalBorrowed)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-xl font-bold text-green-700">{formatCurrencyLocal(totalPaid)}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">Outstanding</p>
          <p className="text-xl font-bold text-yellow-700">{formatCurrencyLocal(totalOutstanding)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">Active Loans</p>
          <p className="text-xl font-bold text-purple-700">{activeLoans.length}</p>
        </div>
      </div>

      {/* Payment Progress Bar */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Payment Progress</span>
          <span className="text-sm font-medium text-gray-700">{paymentProgress.toFixed(1)}% Paid</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-primary-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${paymentProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Remaining: {remainingPercentage.toFixed(1)}%</span>
          <span>Total Payable: {formatCurrencyLocal(totalPayable)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'loans'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Loans ({customerLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Payments ({customerPayments.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Loan Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {customerLoans.slice(0, 2).map((loan) => (
                <div key={loan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{loan.loan_no}</p>
                      <p className="text-xs text-gray-500">{loan.product_details?.product_name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Principal:</span>
                      <span className="ml-1 font-medium">{formatCurrencyLocal(loan.principal)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Paid:</span>
                      <span className="ml-1 font-medium text-green-600">{formatCurrencyLocal(loan.amount_paid)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Balance:</span>
                      <span className="ml-1 font-medium text-red-600">{formatCurrencyLocal(loan.outstanding_balance)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Maturity:</span>
                      <span className="ml-1 font-medium">{formatDate(loan.maturity_date)}</span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-primary-600 h-1.5 rounded-full"
                      style={{ width: `${loan.total_payable > 0 ? (loan.amount_paid / loan.total_payable) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Payments */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Payments</h4>
              <div className="space-y-2">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.transaction_ref}</p>
                        <p className="text-xs text-gray-500">{formatDate(payment.payment_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{formatCurrencyLocal(payment.amount_paid)}</p>
                        <p className="text-xs text-gray-500 capitalize">{payment.payment_method}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No payments recorded yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerLoans.map((loan) => {
                  const progress = loan.total_payable > 0 ? (loan.amount_paid / loan.total_payable) * 100 : 0;
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.loan_no}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{loan.product_details?.product_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrencyLocal(loan.principal)}</td>
                      <td className="px-4 py-3 text-sm text-green-600">{formatCurrencyLocal(loan.amount_paid)}</td>
                      <td className="px-4 py-3 text-sm text-red-600">{formatCurrencyLocal(loan.outstanding_balance)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(loan.maturity_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.transaction_ref}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.loan?.loan_no}</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">{formatCurrencyLocal(payment.amount_paid)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{payment.payment_method}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {payment.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPaymentHistory;