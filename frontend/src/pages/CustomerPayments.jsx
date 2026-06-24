import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatters';

const CustomerPayments = () => {
  // Sample data - will be replaced with real API data
  const payments = [
    {
      id: 1,
      transaction_ref: 'PAY-001',
      loan_no: 'LN-001',
      amount_paid: 50000,
      payment_method: 'cash',
      payment_date: '2026-06-01',
      status: 'completed',
    },
    {
      id: 2,
      transaction_ref: 'PAY-002',
      loan_no: 'LN-001',
      amount_paid: 50000,
      payment_method: 'mpesa',
      payment_date: '2026-05-15',
      status: 'completed',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <Link to="/customer/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
              ← Back to Dashboard
            </Link>
          </div>
          
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
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.transaction_ref}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.loan_no}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(payment.amount_paid)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{payment.payment_method}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPayments;